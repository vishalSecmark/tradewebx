# DynamicPage Configuration Guide

## Table of Contents
1. [Overview](#overview)
2. [Root Level Configuration](#root-level-configuration)
3. [Filter Configuration](#filter-configuration)
4. [Button Configuration](#button-configuration)
5. [Level Configuration](#level-configuration)
6. [Entry Form Configuration](#entry-form-configuration)
7. [Settings Object](#settings-object)
8. [Complete Example](#complete-example)
9. [Validation Rules](#validation-rules)

---

## Overview

The DynamicPage configuration is a JSON structure that defines how dynamic reports, data tables, and entry forms are displayed and behave in the application. This configuration is stored in the `pageData` property of menu items and controls everything from data fetching to UI rendering.

### Basic Structure

```json
{
  "pageData": [
    {
      // Root level configuration
      "wPage": "string",
      "level": "string",
      "Sql": "string",
      "autoFetch": "string",
      "filterType": "string",
      "filters": [],
      "levels": [],
      "Entry": {},
      "MasterbuttonConfig": [],
      "buttonConfig": []
    }
  ]
}
```

---

## Root Level Configuration

These properties are defined at the top level of the pageData object.

### `wPage`
- **Type:** `string`
- **Required:** Yes
- **Description:** Unique identifier/name for the page. Used in API calls and for tracking purposes.
- **Example:** `"wPage": "ClientMaster"`

### `level`
- **Type:** `string`
- **Required:** Yes
- **Description:** Display name for the main/first level tab. This is what users see in the UI.
- **Example:** `"level": "Client List"`

### `Sql`
- **Type:** `string`
- **Required:** Yes
- **Description:** Name of the stored procedure or SQL query to fetch data. This is sent to the backend API.
- **Example:** `"Sql": "usp_GetClientData"`

### `autoFetch`
- **Type:** `string` ("true" | "false")
- **Required:** No
- **Default:** `"true"`
- **Description:**
  - `"true"`: Data is automatically fetched when the page loads
  - `"false"`: User must manually apply filters to fetch data (filter modal auto-opens)
- **Example:** `"autoFetch": "false"`
- **Use Case:** Set to `"false"` when you have mandatory filters that users must configure before fetching large datasets.

### `filterType`
- **Type:** `string` ("onPage" | undefined)
- **Required:** No
- **Description:**
  - `"onPage"`: Filters are displayed horizontally at the top of the page
  - `undefined` or any other value: Filters open in a modal dialog
- **Example:** `"filterType": "onPage"`

### `isShortAble`
- **Type:** `string` ("true" | "false")
- **Required:** No
- **Default:** `"true"`
- **Description:** Controls whether users can sort table columns by clicking on headers.
- **Example:** `"isShortAble": "true"`

### `gridType`
- **Type:** `string`
- **Required:** No
- **Description:** Defines the visual style of the data grid.
- **Possible Values:** `"table"`, `"striped"`, `"bordered"`
- **Example:** `"gridType": "striped"`

### `horizontalScroll`
- **Type:** `number` (0 | 1)
- **Required:** No
- **Default:** `0`
- **Description:**
  - `1`: Enable horizontal scrolling for wide tables
  - `0`: No horizontal scroll (may cause wrapping)
- **Example:** `"horizontalScroll": 1`

---

## Filter Configuration

Filters allow users to narrow down the data displayed in the table. They are defined in a nested array structure.

### Structure

```json
"filters": [
  [
    {
      "type": "FilterType",
      "wKey": "string | array",
      "wValue": "string | array",
      "label": "string",
      "required": boolean,
      "placeholder": "string",
      "options": []
    }
  ]
]
```

### Filter Types

#### 1. WDateRangeBox
Date range picker with start and end dates.

```json
{
  "type": "WDateRangeBox",
  "wKey": ["FromDate", "ToDate"],
  "wValue": ["20240401", "20241031"],
  "label": "Date Range"
}
```

**Properties:**
- `wKey`: Array with exactly 2 elements [fromDateKey, toDateKey]
- `wValue`: Array with 2 dates in YYYYMMDD format (optional, defaults to financial year)
- `label`: Display label for the filter

**Default Behavior:** If no `wValue` is provided, defaults to current financial year (April 1st to current date).

#### 2. WTextBox
Single-line text input field.

```json
{
  "type": "WTextBox",
  "wKey": "ClientCode",
  "wValue": "",
  "label": "Client Code",
  "placeholder": "Enter client code",
  "required": false
}
```

**Properties:**
- `wKey`: Field name sent to API
- `wValue`: Default/pre-filled value
- `label`: Display label
- `placeholder`: Input placeholder text
- `required`: Whether field is mandatory

#### 3. WDropdown
Dropdown select field.

```json
{
  "type": "WDropdown",
  "wKey": "Status",
  "wValue": "",
  "label": "Status",
  "options": [
    {"label": "Active", "value": "A"},
    {"label": "Inactive", "value": "I"}
  ],
  "optionSource": "api"
}
```

**Properties:**
- `wKey`: Field name sent to API
- `wValue`: Default selected value
- `label`: Display label
- `options`: Array of {label, value} objects
- `optionSource`: `"api"` to fetch options from backend, `"static"` for hardcoded options

#### 4. WDatePicker
Single date picker.

```json
{
  "type": "WDatePicker",
  "wKey": "TransactionDate",
  "wValue": "20241031",
  "label": "Transaction Date",
  "required": true
}
```

**Properties:**
- `wKey`: Field name sent to API
- `wValue`: Default date in YYYYMMDD format
- `label`: Display label
- `required`: Whether field is mandatory

#### 5. WNumberBox
Numeric input field.

```json
{
  "type": "WNumberBox",
  "wKey": "Amount",
  "wValue": "0",
  "label": "Amount",
  "min": 0,
  "max": 999999,
  "required": false
}
```

**Properties:**
- `wKey`: Field name sent to API
- `wValue`: Default numeric value
- `label`: Display label
- `min`: Minimum allowed value
- `max`: Maximum allowed value
- `required`: Whether field is mandatory

### Filter Grouping

Filters in the same inner array are displayed in the same row:

```json
"filters": [
  [
    // Row 1
    {"type": "WTextBox", "wKey": "ClientCode", "label": "Client Code"},
    {"type": "WTextBox", "wKey": "ClientName", "label": "Client Name"}
  ],
  [
    // Row 2
    {"type": "WDateRangeBox", "wKey": ["FromDate", "ToDate"], "label": "Date Range"}
  ]
]
```

---

## Button Configuration

Controls which action buttons are displayed and enabled in the UI.

### MasterbuttonConfig

Controls page-level buttons (displayed in the top action bar).

```json
"MasterbuttonConfig": [
  {
    "ButtonType": "Add",
    "EnabledTag": "true"
  },
  {
    "ButtonType": "Edit",
    "EnabledTag": "false"
  },
  {
    "ButtonType": "Delete",
    "EnabledTag": "true"
  },
  {
    "ButtonType": "Excel",
    "EnabledTag": "true"
  },
  {
    "ButtonType": "CSV",
    "EnabledTag": "true"
  },
  {
    "ButtonType": "PDF",
    "EnabledTag": "true"
  },
  {
    "ButtonType": "Email",
    "EnabledTag": "true"
  },
  {
    "ButtonType": "ExportEmail",
    "EnabledTag": "false"
  },
  {
    "ButtonType": "Download",
    "EnabledTag": "true"
  }
]
```

#### Available Button Types:

| Button Type | Description | When Visible |
|------------|-------------|--------------|
| `Add` | Add new entry button | Entry/MultiEntry pages |
| `Edit` | Bulk edit selected rows | When rows are selected + EditableColumn is set |
| `Delete` | Delete records | Entry/MultiEntry pages |
| `Excel` | Export to Excel (max 25,000 records) | Always |
| `CSV` | Export to CSV | When no additional tables |
| `PDF` | Export to PDF (max 8,000 records) | When no additional tables |
| `Email` | Email report as PDF | Always |
| `ExportEmail` | Alternative email export | Always |
| `Download` | Download options menu | When showTypstFlag is true |

**Properties:**
- `ButtonType`: Type of button (see table above)
- `EnabledTag`: `"true"` to show button, `"false"` to hide

### buttonConfig

Controls row-level action buttons (displayed in each table row).

```json
"buttonConfig": [
  {
    "ButtonType": "Add",
    "EnabledTag": "true"
  },
  {
    "ButtonType": "Edit",
    "EnabledTag": "true"
  },
  {
    "ButtonType": "Delete",
    "EnabledTag": "true"
  }
]
```

#### Available Row Button Types:

| Button Type | Description | Action |
|------------|-------------|--------|
| `Add` | Add new entry from row context | Opens entry modal |
| `Edit` | Edit this specific row | Opens entry modal with row data |
| `Delete` | Delete this specific row | Shows confirmation, then deletes |

---

## Level Configuration

Levels define multi-tier data navigation (e.g., Master-Detail views). Each level represents a different view/data set.

### Structure

```json
"levels": [
  {
    "name": "string",
    "primaryHeaderKey": "string",
    "primaryKey": "string",
    "level": number,
    "isShortAble": "string",
    "J_Ui": {},
    "settings": {},
    "summary": {}
  }
]
```

### Level Properties

#### `name`
- **Type:** `string`
- **Required:** Yes
- **Description:** Display name for the level tab
- **Example:** `"name": "Client Details"`

#### `primaryHeaderKey`
- **Type:** `string`
- **Required:** Yes
- **Description:** The column name used to identify records when navigating to the next level. When a user clicks a row, this field's value is passed as a filter to the next level.
- **Example:** `"primaryHeaderKey": "ClientId"`

#### `primaryKey`
- **Type:** `string`
- **Required:** Yes
- **Description:** Primary identifier field for the current level's data. Often the same as primaryHeaderKey.
- **Example:** `"primaryKey": "ClientId"`

#### `level`
- **Type:** `number`
- **Required:** Yes
- **Description:** Zero-based level index (0 = first level, 1 = second level, etc.)
- **Example:** `"level": 0`

#### `isShortAble`
- **Type:** `string` ("true" | "false")
- **Required:** No
- **Description:** Override sorting for this specific level
- **Example:** `"isShortAble": "false"`

### `J_Ui` Object

Configuration sent to the API for this level.

```json
"J_Ui": {
  "ActionName": "ClientMaster",
  "Option": "SELECT",
  "Level": 0,
  "RequestFrom": "W"
}
```

**Properties:**
- `ActionName`: Page/action identifier
- `Option`: Operation type (SELECT, INSERT, UPDATE, DELETE, etc.)
- `Level`: Current level number
- `RequestFrom`: Request source (`"W"` = Web, `"M"` = Mobile)

### `summary` Object

Defines column summaries displayed at the bottom of tables.

```json
"summary": {
  "columns": ["Amount", "Quantity", "Total"],
  "type": "sum"
}
```

**Properties:**
- `columns`: Array of column names to summarize
- `type`: Summary calculation type (`"sum"`, `"avg"`, `"count"`, etc.)

---

## Entry Form Configuration

Defines forms for adding/editing records.

### Structure

```json
"Entry": {
  "MasterEntry": {
    "title": "string",
    "sql": "string",
    "J_Ui": {},
    "J_Api": {},
    "formFields": []
  },
  "DetailEntry": {
    // Similar structure for detail/child records
  }
}
```

### Entry Properties

#### `MasterEntry`
Configuration for master/main record forms.

```json
"MasterEntry": {
  "title": "Add Client",
  "sql": "usp_InsertUpdateClient",

  "J_Ui": {
    "ActionName": "ClientMaster",
    "Option": "INSERT",
    "RequestFrom": "W"
  },

  "J_Api": {
    "UserId": "{{userId}}",
    "UserType": "{{userType}}"
  },

  "formFields": [
    [
      {
        "type": "WTextBox",
        "wKey": "ClientCode",
        "label": "Client Code",
        "required": true,
        "disabled": false,
        "placeholder": "Enter client code",
        "maxLength": 10
      }
    ]
  ]
}
```

**Properties:**
- `title`: Form dialog title
- `sql`: Stored procedure for insert/update operations
- `J_Ui`: API configuration (Option changes to INSERT/UPDATE based on action)
- `J_Api`: Additional API parameters (supports placeholders like `{{userId}}`)
- `formFields`: Nested array of form field configurations

#### Form Field Types

All filter types (WTextBox, WDropdown, WDatePicker, etc.) can be used as form fields with additional properties:

**Common Form Field Properties:**
```json
{
  "type": "WTextBox",
  "wKey": "FieldName",           // Field identifier
  "label": "Field Label",         // Display label
  "required": true,               // Is mandatory
  "disabled": false,              // Is read-only
  "placeholder": "Enter value",   // Input placeholder
  "defaultValue": "value",        // Default value
  "maxLength": 50,                // Max character length (text fields)
  "min": 0,                       // Min value (number fields)
  "max": 999999,                  // Max value (number fields)
  "validation": "email|phone|url" // Validation type
}
```

#### DetailEntry

Similar structure to MasterEntry but for child/detail records in master-detail relationships.

```json
"DetailEntry": {
  "title": "Add Transaction",
  "sql": "usp_InsertUpdateTransaction",
  "J_Ui": {
    "ActionName": "ClientMaster",
    "Option": "INSERTDETAIL",
    "RequestFrom": "W"
  },
  "formFields": [
    // Field configurations
  ]
}
```

---

## Settings Object

Level-specific display and behavior settings.

```json
"settings": {
  "gridType": "striped",
  "gridDirection": "horizontal",
  "borderStyle": "solid",
  "borderColor": "#e5e7eb",
  "fontSize": 14,
  "showTypstFlag": true,
  "EditableColumn": "Amount,Quantity,Remarks",
  "hideMultiEditColumn": "ClientCode,CreatedDate",
  "ShowViewDocument": true,
  "mobileColumns": ["ClientCode", "ClientName"],
  "tabletColumns": ["ClientCode", "ClientName", "Mobile"],
  "webColumns": ["ClientCode", "ClientName", "Mobile", "Email", "City"]
}
```

### Settings Properties

#### `gridType`
- **Type:** `string`
- **Values:** `"table"`, `"striped"`, `"bordered"`
- **Description:** Visual style of the table
- **Example:** `"gridType": "striped"`

#### `gridDirection`
- **Type:** `string`
- **Values:** `"horizontal"`, `"vertical"`
- **Description:** Table layout direction
- **Example:** `"gridDirection": "horizontal"`

#### `borderStyle`
- **Type:** `string`
- **Values:** `"solid"`, `"dashed"`, `"dotted"`, `"none"`
- **Description:** Table border style
- **Example:** `"borderStyle": "solid"`

#### `borderColor`
- **Type:** `string`
- **Description:** Hex color code for borders
- **Example:** `"borderColor": "#e5e7eb"`

#### `fontSize`
- **Type:** `number`
- **Description:** Font size in pixels for table text
- **Example:** `"fontSize": 14`

#### `showTypstFlag`
- **Type:** `boolean`
- **Description:** Show advanced download/type options button
- **Example:** `"showTypstFlag": true`

#### `EditableColumn`
- **Type:** `string` (comma-separated column names)
- **Description:** Columns that can be edited in bulk edit mode. When rows are selected and Edit button is clicked, only these columns can be modified.
- **Example:** `"EditableColumn": "Amount,Quantity,Status,Remarks"`

#### `hideMultiEditColumn`
- **Type:** `string` (comma-separated column names)
- **Description:** Columns to hide in the bulk edit modal. Useful for hiding system fields or read-only data.
- **Example:** `"hideMultiEditColumn": "Id,CreatedBy,CreatedDate,ModifiedDate"`

#### `ShowViewDocument`
- **Type:** `boolean`
- **Description:** Show document viewer button for records with attachments
- **Example:** `"ShowViewDocument": true`

### Responsive Column Configuration

Controls which columns are visible on different screen sizes.

#### `mobileColumns`
- **Type:** `array of strings`
- **Description:** Columns visible on mobile devices (< 768px)
- **Recommendation:** Show only 2-3 most important columns
- **Example:** `"mobileColumns": ["ClientCode", "ClientName"]`

#### `tabletColumns`
- **Type:** `array of strings`
- **Description:** Columns visible on tablet devices (768px - 1024px)
- **Recommendation:** Show 3-5 important columns
- **Example:** `"tabletColumns": ["ClientCode", "ClientName", "Mobile", "Email"]`

#### `webColumns`
- **Type:** `array of strings`
- **Description:** Columns visible on desktop/web (> 1024px)
- **Recommendation:** Show all relevant columns
- **Example:** `"webColumns": ["ClientCode", "ClientName", "Mobile", "Email", "City", "Status", "Balance"]`

**Note:** If responsive columns are not specified, all columns from the API response will be displayed.

---

## Complete Example

Here's a complete, real-world example of a Client Master page with master-detail relationship:

```json
{
  "pageData": [
    {
      "wPage": "ClientMaster",
      "level": "Client List",
      "Sql": "usp_GetClientData",
      "autoFetch": "false",
      "filterType": "onPage",
      "isShortAble": "true",
      "gridType": "striped",
      "horizontalScroll": 1,

      "filters": [
        [
          {
            "type": "WDateRangeBox",
            "wKey": ["FromDate", "ToDate"],
            "wValue": ["20240401", "20241031"],
            "label": "Registration Date Range"
          },
          {
            "type": "WTextBox",
            "wKey": "ClientCode",
            "wValue": "",
            "label": "Client Code",
            "placeholder": "Enter client code"
          }
        ],
        [
          {
            "type": "WDropdown",
            "wKey": "Status",
            "wValue": "",
            "label": "Status",
            "options": [
              {"label": "All", "value": ""},
              {"label": "Active", "value": "A"},
              {"label": "Inactive", "value": "I"},
              {"label": "Suspended", "value": "S"}
            ]
          },
          {
            "type": "WTextBox",
            "wKey": "ClientName",
            "wValue": "",
            "label": "Client Name",
            "placeholder": "Search by name"
          }
        ]
      ],

      "MasterbuttonConfig": [
        {"ButtonType": "Add", "EnabledTag": "true"},
        {"ButtonType": "Edit", "EnabledTag": "true"},
        {"ButtonType": "Delete", "EnabledTag": "true"},
        {"ButtonType": "Excel", "EnabledTag": "true"},
        {"ButtonType": "CSV", "EnabledTag": "true"},
        {"ButtonType": "PDF", "EnabledTag": "true"},
        {"ButtonType": "Email", "EnabledTag": "true"},
        {"ButtonType": "Download", "EnabledTag": "false"}
      ],

      "buttonConfig": [
        {"ButtonType": "Add", "EnabledTag": "true"},
        {"ButtonType": "Edit", "EnabledTag": "true"},
        {"ButtonType": "Delete", "EnabledTag": "true"}
      ],

      "levels": [
        {
          "name": "Client Master",
          "primaryHeaderKey": "ClientCode",
          "primaryKey": "ClientCode",
          "level": 0,
          "isShortAble": "true",

          "J_Ui": {
            "ActionName": "ClientMaster",
            "Option": "SELECT",
            "Level": 0,
            "RequestFrom": "W"
          },

          "settings": {
            "gridType": "striped",
            "gridDirection": "horizontal",
            "borderStyle": "solid",
            "borderColor": "#e5e7eb",
            "fontSize": 14,
            "showTypstFlag": false,
            "EditableColumn": "Mobile,Email,Address,City,Pincode,Status",
            "hideMultiEditColumn": "ClientCode,CreatedDate,CreatedBy",
            "ShowViewDocument": true,
            "mobileColumns": ["ClientCode", "ClientName", "Mobile"],
            "tabletColumns": ["ClientCode", "ClientName", "Mobile", "Email", "Status"],
            "webColumns": ["ClientCode", "ClientName", "Mobile", "Email", "City", "Pincode", "Status", "Balance", "CreatedDate"]
          },

          "summary": {
            "columns": ["Balance"],
            "type": "sum"
          }
        },
        {
          "name": "Transactions",
          "primaryHeaderKey": "TransactionId",
          "primaryKey": "TransactionId",
          "level": 1,
          "isShortAble": "true",

          "J_Ui": {
            "ActionName": "ClientMaster",
            "Option": "SELECTTRANSACTIONS",
            "Level": 1,
            "RequestFrom": "W"
          },

          "settings": {
            "gridType": "striped",
            "gridDirection": "horizontal",
            "borderStyle": "solid",
            "borderColor": "#e5e7eb",
            "fontSize": 13,
            "EditableColumn": "Remarks,Status",
            "ShowViewDocument": false,
            "mobileColumns": ["TransactionDate", "Amount", "Type"],
            "tabletColumns": ["TransactionDate", "Type", "Amount", "Balance", "Status"],
            "webColumns": ["TransactionId", "TransactionDate", "Type", "Amount", "Balance", "Status", "Remarks", "CreatedDate"]
          },

          "summary": {
            "columns": ["Amount"],
            "type": "sum"
          }
        }
      ],

      "Entry": {
        "MasterEntry": {
          "title": "Add/Edit Client",
          "sql": "usp_InsertUpdateClient",

          "J_Ui": {
            "ActionName": "ClientMaster",
            "Option": "INSERT",
            "RequestFrom": "W"
          },

          "J_Api": {
            "UserId": "{{userId}}",
            "UserType": "{{userType}}"
          },

          "formFields": [
            [
              {
                "type": "WTextBox",
                "wKey": "ClientCode",
                "label": "Client Code",
                "required": true,
                "disabled": false,
                "placeholder": "Enter client code",
                "maxLength": 10
              },
              {
                "type": "WTextBox",
                "wKey": "ClientName",
                "label": "Client Name",
                "required": true,
                "placeholder": "Enter full name",
                "maxLength": 100
              }
            ],
            [
              {
                "type": "WTextBox",
                "wKey": "Mobile",
                "label": "Mobile Number",
                "required": true,
                "placeholder": "10 digit mobile",
                "maxLength": 10,
                "validation": "phone"
              },
              {
                "type": "WTextBox",
                "wKey": "Email",
                "label": "Email Address",
                "required": false,
                "placeholder": "email@example.com",
                "validation": "email"
              }
            ],
            [
              {
                "type": "WTextBox",
                "wKey": "Address",
                "label": "Address",
                "required": false,
                "placeholder": "Street address",
                "maxLength": 200
              }
            ],
            [
              {
                "type": "WTextBox",
                "wKey": "City",
                "label": "City",
                "required": true,
                "placeholder": "City name",
                "maxLength": 50
              },
              {
                "type": "WTextBox",
                "wKey": "Pincode",
                "label": "Pincode",
                "required": false,
                "placeholder": "6 digit pincode",
                "maxLength": 6
              }
            ],
            [
              {
                "type": "WDropdown",
                "wKey": "Status",
                "label": "Status",
                "required": true,
                "options": [
                  {"label": "Active", "value": "A"},
                  {"label": "Inactive", "value": "I"}
                ]
              },
              {
                "type": "WDatePicker",
                "wKey": "RegistrationDate",
                "label": "Registration Date",
                "required": true
              }
            ]
          ]
        },

        "DetailEntry": {
          "title": "Add Transaction",
          "sql": "usp_InsertTransaction",

          "J_Ui": {
            "ActionName": "ClientMaster",
            "Option": "INSERTTRANSACTION",
            "RequestFrom": "W"
          },

          "J_Api": {
            "UserId": "{{userId}}",
            "UserType": "{{userType}}"
          },

          "formFields": [
            [
              {
                "type": "WDatePicker",
                "wKey": "TransactionDate",
                "label": "Transaction Date",
                "required": true
              },
              {
                "type": "WDropdown",
                "wKey": "TransactionType",
                "label": "Type",
                "required": true,
                "options": [
                  {"label": "Credit", "value": "CR"},
                  {"label": "Debit", "value": "DR"}
                ]
              }
            ],
            [
              {
                "type": "WNumberBox",
                "wKey": "Amount",
                "label": "Amount",
                "required": true,
                "min": 0,
                "max": 9999999
              }
            ],
            [
              {
                "type": "WTextBox",
                "wKey": "Remarks",
                "label": "Remarks",
                "required": false,
                "placeholder": "Optional remarks",
                "maxLength": 200
              }
            ]
          ]
        }
      }
    }
  ]
}
```

---

## Validation Rules

The DynamicPage component performs automatic validation on the configuration:

### Required Fields

**Root Level:**
- `levels` must be an array with at least one level
- Each filter (if provided) must have valid structure

**Level Configuration:**
- `name` is required for each level
- `J_Ui` must be an object (warning if missing)
- `primaryHeaderKey` and `primaryKey` should be defined

**Filters:**
- `type` is required for each filter
- `wKey` is required
- For `WDateRangeBox`, `wKey` must be an array with 2 elements

### Error Handling

The component will display a detailed error page if:
- `pageData` is not available
- `pageData` is not an array
- `pageData` array is empty
- Required level configurations are missing

### Warnings

The component will log warnings (but still attempt to render) for:
- Missing `J_Ui` in level configuration
- Invalid filter types
- Missing filter labels or keys
- Invalid responsive column configurations

---

## Best Practices

### 1. Filter Design
- Always provide meaningful labels
- Use date range filters for time-based data
- Set `autoFetch: "false"` with `filterType: "onPage"` for better UX on large datasets
- Group related filters in the same row

### 2. Performance
- Limit visible columns on mobile (2-3 max)
- Use responsive column configuration
- Enable horizontal scroll for wide tables
- Set appropriate `EditableColumn` to limit bulk edit scope

### 3. Security
- Never expose sensitive columns in `webColumns`, `tabletColumns`, or `mobileColumns`
- Use `hideMultiEditColumn` to prevent editing of system fields
- Validate user permissions server-side (not just UI)

### 4. Usability
- Provide clear button configurations
- Use summary columns for financial/numeric data
- Set appropriate `primaryHeaderKey` for multi-level navigation
- Use descriptive level names

### 5. Data Integrity
- Always define `sql` property with valid stored procedure
- Ensure `primaryKey` matches database primary key
- Use proper validation types in form fields
- Set appropriate `maxLength`, `min`, `max` constraints

---

## Troubleshooting

### Common Issues

**Issue:** Filters not showing
- **Solution:** Check that `filters` is a nested array: `[[{...}]]`
- Verify filter objects have `type`, `wKey`, and `label`

**Issue:** Buttons not appearing
- **Solution:** Check `EnabledTag` is `"true"` (string, not boolean)
- Verify `componentType` is set to `"entry"` or `"multientry"` for entry buttons

**Issue:** Columns not responsive
- **Solution:** Ensure `mobileColumns`, `tabletColumns`, `webColumns` are defined
- Verify column names match API response field names exactly (case-sensitive)

**Issue:** Multi-level navigation not working
- **Solution:** Verify `primaryHeaderKey` matches a column in the data
- Check that each level has unique `level` number (0, 1, 2, etc.)
- Ensure `J_Ui.Level` matches the level number

**Issue:** Entry form not opening
- **Solution:** Check `Entry.MasterEntry` is properly configured
- Verify `formFields` is a nested array structure
- Ensure `componentType` is `"entry"` or `"multientry"`

---

## API Integration

### Data Fetching

When fetching data, the component sends an XML payload to the API:

```xml
<dsXml>
    <J_Ui>{"ActionName":"ClientMaster","Option":"SELECT","Level":0,"RequestFrom":"W"}</J_Ui>
    <Sql>usp_GetClientData</Sql>
    <X_Filter>
        <FromDate>20240401</FromDate>
        <ToDate>20241031</ToDate>
        <ClientCode>CLI001</ClientCode>
    </X_Filter>
    <X_GFilter></X_GFilter>
    <J_Api>"UserId":"user123", "UserType":"admin"</J_Api>
</dsXml>
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "rs0": [
      // Main data array
      {"ClientCode": "CLI001", "ClientName": "John Doe", ...}
    ],
    "rs1": [
      // Settings/metadata
      {"Settings": "<XmlData>...</XmlData>"}
    ],
    "rs3": [
      // Optional additional table
    ]
  }
}
```

### Error Handling

If the API returns an error:

```json
{
  "rs0": [
    {
      "ErrorFlag": "E",
      "ErrorMessage": "Invalid client code"
    }
  ]
}
```

The component will display an error modal with the message.

---

## Version History

- **v1.0** - Initial configuration structure
- **v1.1** - Added responsive column support
- **v1.2** - Added bulk edit functionality with `EditableColumn` and `hideMultiEditColumn`
- **v1.3** - Added validation framework and error handling
- **v1.4** - Added caching mechanism for improved performance
- **v1.5** - Added multi-level navigation support

---

## Support

For additional help or questions about DynamicPage configuration:
1. Check the validation errors displayed in the UI
2. Review the browser console for detailed error logs
3. Verify your configuration against the examples in this document
4. Contact the development team with the Debug Information from the error screen
