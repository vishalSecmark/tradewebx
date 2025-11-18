"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Select, { SingleValue } from "react-select";
import { useTheme } from "@/context/ThemeContext";
import { getLocalStorage, storeLocalStorage, removeLocalStorage } from "@/utils/helper";
import apiService from "@/utils/apiService";
import { ACTION_NAME, BASE_URL, PATH_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
import { toast } from "react-toastify";
import {DataGrid,  Column } from "react-data-grid";
import { FiEye, FiEyeOff } from "react-icons/fi";

/* ----------------------------- Types ------------------------------ */

type KeyValue = Record<string, any>;

interface Option {
  label: string;
  value: string;
}

/* ------------------------------ XML ------------------------------ */

const buildValidatePasswordXml = (password: string) => `
  <dsXml>
    <J_Ui>"ActionName":"QueryForm","Option":"ValidatePassword"</J_Ui>
    <Sql/>
    <X_Filter></X_Filter>
    <X_Filter_Multiple>
      <Password>${password}</Password>
    </X_Filter_Multiple>
    <X_GFilter/>
    <J_Api>"UserId":"${getLocalStorage('userId')}", "UserType":"${getLocalStorage('userType')}"</J_Api>
  </dsXml>
`;

const buildDatabaseXml = () => `
  <dsXml>
    <J_Ui>"ActionName":"QueryForm","Option":"DataBase"</J_Ui>
    <Sql/>
    <X_Filter></X_Filter>
    <X_GFilter/>
    <J_Api>"UserId":"${getLocalStorage('userId')}", "UserType":"${getLocalStorage('userType')}"</J_Api>
  </dsXml>
`;

const buildExecuteQueryXml = (query: string) => `
  <dsXml>
    <J_Ui>"ActionName":"${ACTION_NAME}","Option":"GetDataQueryForm"</J_Ui>
    <Sql/>
    <X_Filter>
      <Query>${query}</Query>
    </X_Filter>
    <X_GFilter/>
    <J_Api>"UserId":"${getLocalStorage('userId')}", "UserType":"${getLocalStorage('userType')}"</J_Api>
  </dsXml>
`;

/* ------------------------------------------------------------------ */

export default function QueryFormPage() {
  const { colors } = useTheme();

  const AUTH_KEY = "queryFormAuth";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getLocalStorage(AUTH_KEY));

  const [loading, setLoading] = useState(false);

  /* Password state */
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* DB Dropdown */
  const [dbOptions, setDbOptions] = useState<Option[]>([]);
  const [selectedDb, setSelectedDb] = useState<Option | null>(null);

  /* Query */
  const [queryText, setQueryText] = useState("SELECT TOP 100 * FROM CLIENT_MASTER(NOLOCK)");

  /* Results */
  const [rows, setRows] = useState<KeyValue[]>([]);
  const [columns, setColumns] = useState<Column<KeyValue>[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  /* Refs */
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const queryTextRef = useRef<HTMLTextAreaElement | null>(null);

  /* Focus password on load */
  useEffect(() => {
    if (!isAuthenticated) passwordInputRef.current?.focus();
  }, [isAuthenticated]);

  /* ------------------ Fetch DB Options ------------------ */
  const fetchDatabases = async () => {
    try {
      setLoading(true);

      const xmlData = buildDatabaseXml();
      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

      const list = response?.data?.data?.rs0 || [];

      const finalOptions: Option[] = list.map((item: any) => ({
        label: (item?.DisplayName || "").trim(),
        value: (item?.Value || "").trim(),
      }));

      setDbOptions(finalOptions);
    } catch {
      toast.error("Failed to load databases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchDatabases();
  }, [isAuthenticated]);

  /* ------------------ Password Submit ------------------ */
  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setPasswordError("");

    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const xmlData = buildValidatePasswordXml(password.trim());
      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

      // Real response contains:
      // Column1: "<Flag>S</Flag><Message>Password Match</Message>"
      const colData = response?.data?.data?.rs0?.[0]?.Column1 || "";

      const flag = colData.match(/<Flag>(.*?)<\/Flag>/)?.[1] || "";
      const message = colData.match(/<Message>(.*?)<\/Message>/)?.[1] || "Invalid password";

      if (flag !== "S") {
        setPasswordError(message);
        toast.error(message);
        return;
      }

      toast.success(message);
      storeLocalStorage(AUTH_KEY, "true");
      setIsAuthenticated(true);

      setTimeout(() => queryTextRef.current?.focus(), 150);
    } catch {
      setPasswordError("Failed to validate password");
      toast.error("Password validation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Logout ------------------ */
  const handleLogout = () => {
    removeLocalStorage(AUTH_KEY);
    setIsAuthenticated(false);
    setRows([]);
    setColumns([]);
    setSelectedDb(null);
    setQueryText("SELECT TOP 100 * FROM CLIENT_MASTER(NOLOCK)");
    setPassword("");
  };

  /* ------------------ Execute Query ------------------ */
  const handleExecute = async () => {
    if (!selectedDb) return toast.error("Please select a database");
    if (!queryText.trim()) return toast.error("Query cannot be empty");

    setRows([]);
    setColumns([]);
    setLoading(true);

    try {
      const xmlData = buildExecuteQueryXml(queryText.trim());
      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

      const returnedRows = response?.data?.data?.rs0 || [];

      if (!returnedRows.length) {
        setStatusMessage("No results found.");
        return;
      }

      // Generate react-data-grid columns
      const keys = Array.from(
        new Set(
          returnedRows.flatMap((row: KeyValue) => Object.keys(row))
        )
      ) as string[];

      const gridColumns: Column<KeyValue>[] = keys.map((key: string) => ({
        key,
        name: key,
        width: 200,
        resizable: true,
      }));


      setColumns(gridColumns);
      setRows(returnedRows);
      setStatusMessage(`Query executed. ${returnedRows.length} row(s).`);
    } catch {
      toast.error("Query execution failed");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Clear ------------------ */
  const handleClear = () => {
    setQueryText("");
    setRows([]);
    setColumns([]);
    setStatusMessage("");
    queryTextRef.current?.focus();
  };

  /* ------------------ MAIN JSX ------------------ */

  return (
    <main
      style={{
        background: colors.background,
        minHeight: "100vh",
        padding: 20,
      }}
    >
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
          <Loader />
        </div>
      )}

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: colors.background2,
          padding: 20,
          borderRadius: 8,
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 20,
            color: colors.text,
          }}
        >
          Query Form
        </h1>

        {/* ------------------ PASSWORD SCREEN ------------------ */}
        {!isAuthenticated ? (
          <form onSubmit={handlePasswordSubmit}>
            <label htmlFor="pwd" style={{ fontWeight: "bold" }}>
              Enter Password:
            </label>

           {/* Password Input with Eye Icon */}
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  id="pwd"
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 10px", // leave space for icon
                    marginTop: 6,
                    borderRadius: 6,
                    border: `1px solid ${colors.textInputBorder}`,
                  }}
                />

                {/* Eye Icon */}
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: colors.text,
                    fontSize: 20,
                  }}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            {passwordError && <p style={{ color: colors.errorText }}>{passwordError}</p>}
            <button
              type="submit"
              style={{
                marginTop: 12,
                padding: "10px 16px",
                background: colors.buttonBackground,
                color: colors.buttonText,
                borderRadius: 6,
                border: "none",
              }}
            >
              Validate
            </button>
          </form>
        ) : (
          <>
            {/* DB SELECT */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: "bold" }}>Database:</label>

              <Select
                inputId="db-select"
                options={dbOptions}
                value={selectedDb}
                placeholder="Select Database"
                isClearable
                onChange={(value: SingleValue<Option>) => setSelectedDb(value)}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: colors.textInputBorder,
                  }),
                }}
              />
            </div>

            {/* QUERY AREA */}
            <label style={{ fontWeight: "bold" }}>Query:</label>
            <textarea
              ref={queryTextRef}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              style={{
                width: "100%",
                minHeight: 200,
                padding: 10,
                borderRadius: 6,
                border: `1px solid ${colors.textInputBorder}`,
                fontFamily: "monospace",
                marginBottom: 12,
              }}
            />

            {/* BUTTONS */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleExecute}
                style={{
                  padding: "10px 18px",
                  background: colors.buttonBackground,
                  color: colors.buttonText,
                  borderRadius: 6,
                  border: "none",
                }}
              >
                Execute
              </button>

              <button
                onClick={handleClear}
                style={{
                  padding: "10px 18px",
                  background: colors.secondary,
                  color: "#000",
                  borderRadius: 6,
                  border: "none",
                }}
              >
                Clear
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: "10px 18px",
                  background: "#d9534f",
                  color: "#fff",
                  borderRadius: 6,
                  border: "none",
                }}
              >
                Logout
              </button>
            </div>

            {/* STATUS */}
            {statusMessage && (
              <p style={{ marginTop: 10, fontWeight: "bold", color: colors.text }}>
                {statusMessage}
              </p>
            )}

            {/* ------------------ RESULTS GRID (react-data-grid) ------------------ */}
            {columns.length > 0 && (
              <div
                style={{
                  height: 400, // makes scrollable grid
                  marginTop: 20,
                }}
              >
                <DataGrid
                  columns={columns}
                  className="rdg-light"
                  rows={rows}
                  style={{
                    height: "100%",
                    background: colors.cardBackground,
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
