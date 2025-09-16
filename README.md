## stack used

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Installation

### Prerequisites
To get started with TailAdmin, ensure you have the following prerequisites installed and set up:

- Node.js 18.x or later (recommended to use Node.js 20.x or later)

### Cloning the Repository
Clone the repository using the following command:

```bash
git clone https://github.com/TailAdmin/free-nextjs-admin-dashboard.git
```

> Windows Users: place the repository near the root of your drive if you face issues while cloning.

1. Install dependencies:
    ```bash
    npm install --legacy-peer-deps
    # or
    yarn install
    ```
    > Some included packages causes peer-deps issue with React 19 while installing.
    >
    > With npm the `--legacy-peer-deps` flag is a workaround for that at the moment.

2. Start the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```

All components are built with React and styled using Tailwind CSS for easy customization.


#### Next Steps

- yarn install to update dependencies.
- Check for any style changes or compatibility issues.
- Refer to the Tailwind CSS v4 [Migration Guide](https://tailwindcss.com/docs/upgrade-guide) on this release. if needed.
- This update keeps the project up to date with the latest Tailwind improvements. 🚀

## for latest changes
[Read more](https://tailadmin.com/docs/update-logs/nextjs) on this release.


### Quick Links
- [✨ Visit Website](https://tailadmin.com)
- [📄 Documentation](https://tailadmin.com/docs)
- [⬇️ Download](https://tailadmin.com/download)
- [🖌️ Figma Design File (Community Edition)](https://www.figma.com/community/file/1463141366275764364)
- [⚡ Get PRO Version](https://tailadmin.com/pricing)

### Demos
- [Free Version](https://nextjs-free-demo.tailadmin.com)
- [Pro Version](https://nextjs-demo.tailadmin.com)

### Other Versions
- [HTML Version](https://github.com/TailAdmin/tailadmin-free-tailwind-dashboard-template)
- [React Version](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard)
- [Vue.js Version](https://github.com/TailAdmin/vue-tailwind-admin-dashboard)


![TailAdmin - Next.js Dashboard Preview](./banner.png)



# Form Field and Settings Documentation

This document describes the commonly used fields in **Normal Form** and
**eKYC Form**.

------------------------------------------------------------------------

## Field Properties

  ------------------------------------------------------------------------------------------
  Field Name                                 Description
  ------------------------------------------ -----------------------------------------------
  **CombinedName**                           Used to make groups in the form. Works only
                                             when `settings.isGroup = true`.

  **FieldEnabledTag**                        Enables or disables the field. `"N"` means
                                             disabled.

  **FieldSize**                              Number of characters or digits allowed.

  **FieldType**                              Field type, e.g., `INT` for number or `STRING`
                                             for text.

  **FieldVisibleTag**                        Controls visibility. `"Y"` means visible.

  **FieldWidth**                             Width of the field (CSS property).

  **FileType**                               Specifies file type if type is `WFile`.

  **GetResponseFlag**                        `"true"`/`"false"` → Calls third-party API in
                                             eKYC form to redirect.

  **OTPRequire**                             Used in eKYC form to check if OTP is required
                                             for number field.

  **OTPSend**                                API object to send OTP.

  **OTPValidate**                            API object to validate OTP.

  **OlddataValue**                           Stores old phone/email when OTP is sent to old
                                             value.

  **ThirdPartyAPI**                          Object for third-party API integration.

  **Srno**                                   Serial number of the field.

  **ValidationAPI**                          API to validate the field on blur.

  **childDependents**                        Array of dependent child entries.

  **isBR**                                   `"true"` → Field occupies full row.

  **isMandatory**                            `"true"` → Field is mandatory.

  **isResizable**                            `"true"` → Allows image crop/resize for file
                                             type fields.

  **isVisibleinTable**                       `"true"`/`"false"` → Show/hide field in
                                             multi-entry tables.

  **redirectUrl**                            `"true"` → Extra button appears to redirect
                                             user (eKYC only).

  **iscreatable**                            `"true"`/`"false"` → If dropdown allows new
                                             entries.

  **label**                                  Field label (e.g., `"Serial No"`).

  **type**                                   Field input type (e.g., `WTextBox`).

  **wKey**                                   Field key (must-have for storing values,
                                             validation, APIs).

  **wValue**                                 Holds old value while editing forms.

  **wDropDownKey**                           Dropdown key/label mapping. Example:
                                             `{ "key": "DisplayName", "value": "Value" }`.

  **wQuery**                                 API object to fetch dropdown options.
  ------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## Settings (Specific to Multi-Tab Forms)

  -----------------------------------------------------------------------
  Setting Name                               Description
  ------------------------------------------ ----------------------------
  **SaveNextAPI**                            API to save data for a
                                             particular tab.

  **TabChangeAPI**                           API to validate tab fields
                                             against master form.

  **isGroup**                                `"true"` → Enables field
                                             grouping with
                                             `CombinedName`.

  **isTable**                                `"true"` → Allows
                                             multi-entry in a tab.

  **maxAllowedRecords**                      Maximum number of records
                                             allowed in a tab.

  **IsChildEntryAllowed**                    `"true"` → Enables
                                             child/guardian form in
                                             nominee tab.

  **ChildEntryAPI**                          API to fetch child/guardian
                                             form in nominee tab.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Example Field Object

``` json
{
  "label": "Serial No",
  "type": "WTextBox",
  "wKey": "SerialNo",
  "wValue": "",
  "FieldType": "INT",
  "FieldSize": "10",
  "FieldVisibleTag": "Y",
  "isMandatory": "true",
  "isBR": "false",
  "Srno": 1
}
```

------------------------------------------------------------------------

## Example Settings Object

``` json
{
  "SaveNextAPI": {},
  "TabChangeAPI": {},
  "isGroup": "true",
  "isTable": "true",
  "maxAllowedRecords": "3",
  "IsChildEntryAllowed": "true",
  "ChildEntryAPI": {}
}
```

------------------------------------------------------------------------

## Notes

-   **`wKey`** is mandatory and used across APIs, validation, and
    filters.
-   **Multi-tab forms** allow table entries and grouping of fields.
-   **eKYC specific fields**: `GetResponseFlag`, `OTPRequire`,
    `OTPSend`, `OTPValidate`, `OlddataValue`, `redirectUrl`.

