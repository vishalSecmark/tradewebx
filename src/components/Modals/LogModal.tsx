import React, { useEffect, useState, useId } from "react";
import AccessibleModal from "@/components/a11y/AccessibleModal";
import { DataGrid, Column } from "react-data-grid";
import apiService from "@/utils/apiService";
import { ACTION_NAME, BASE_URL, PATH_URL } from "@/utils/constants";
import { getLocalStorage } from "@/utils/helper";
import Loader from "@/components/Loader";
import { toast } from "react-toastify";
import { useTheme } from "@/context/ThemeContext";
import "react-data-grid/lib/styles.css";

type LogModalProps = {
    isOpen: boolean;
    onClose: () => void;
    jobId: number | null;
};

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, jobId }) => {
    const titleId = useId();
    const descriptionId = useId();
    const { colors } = useTheme();

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<Column<any>[]>([]);

    useEffect(() => {
        if (isOpen && jobId) {
            fetchLogs(jobId);
        } else {
            setRows([]);
            setColumns([]);
        }
    }, [isOpen, jobId]);

    const fetchLogs = async (id: number) => {
        setLoading(true);
        try {
            const xmlData = `
            <dsXml>
                <J_Ui>"ActionName":"${ACTION_NAME}","Option":"JobScheduleLog"</J_Ui>
                <Sql></Sql>
                <X_Filter>
                    <JobId>${id}</JobId>
                </X_Filter>
                <X_Filter_Multiple></X_Filter_Multiple>
                <J_Api>"UserId":"${getLocalStorage('userId')}", "UserType":"${getLocalStorage('userType')}"</J_Api>
            </dsXml>`;

            const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);
            const data = response?.data?.data?.rs0 || [];

            if (data.length > 0) {
                const keys = Object.keys(data[0]);
                const gridColumns: Column<any>[] = keys.map((key) => {
                    if (key.toLowerCase() === "executionstatus") {
                         return {
                            key,
                            name: key,
                            resizable: true,
                            width: "auto",
                            renderCell: (props) => {
                                const value = props.row[key];
                                const isSuccess = String(value).toLowerCase() === "success";
                                return (
                                    <div title={String(value)} className="w-full h-full flex items-center">
                                         <span
                                            style={{
                                                color: isSuccess ? "#28a745" : "#dc3545",
                                                fontWeight: "bold",
                                                padding: "4px 8px",
                                                borderRadius: "12px",
                                                backgroundColor: isSuccess ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
                                                display: "inline-block"
                                            }}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                );
                            }
                        };
                    }

                    return {
                        key,
                        name: key,
                        resizable: true,
                        width: "auto",
                        renderCell: (props) => {
                            const value = props.row[key];
                            return (
                                <div title={String(value)} className="truncate w-full h-full flex items-center">
                                    {value}
                                </div>
                            );
                        }
                    };
                });
                setColumns(gridColumns);
                setRows(data);
            } else {
                setRows([]);
                setColumns([]);
            }

        } catch (error) {
            console.error("Error fetching logs:", error);
            toast.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AccessibleModal
            isOpen={isOpen}
            onDismiss={onClose}
            labelledBy={titleId}
            describedBy={descriptionId}
            role="dialog"
            className="bg-white p-6 shadow-theme-lg !max-w-6xl w-full rounded-lg" // Increased width for DataGrid
            closeOnOverlayClick={true}
        >
            <div style={{ display: "flex", flexDirection: "column", height: "80vh" }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 id={titleId} className="text-xl font-bold" style={{ color: colors.text }}>
                        Job Log (ID: {jobId})
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-bold"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div id={descriptionId} style={{ flex: 1, position: "relative", minHeight: 0 }}>
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                            <Loader />
                        </div>
                    ) : rows.length > 0 ? (
                        <DataGrid
                            columns={columns}
                            rows={rows}
                            className="rdg-light"
                            style={{ height: "100%", color: colors.text }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No logs found.
                        </div>
                    )}
                </div>
            </div>
        </AccessibleModal>
    );
};

export default LogModal;
