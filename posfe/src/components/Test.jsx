import React, { useEffect, useRef, useState } from "react";
import { HotColumn, HotTable } from "@handsontable/react";
import * as XLSX from "xlsx";
import { checkApi } from "../api/check";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import "./Test.css";
import { DEFAULT_HEADERS } from "../util/constant";

registerAllModules();

export const Test = () => {
  const hotRef = useRef(null);
  const [data, setData] = useState(
    Array.from({ length: 20 }, () => Array(20).fill(""))
  );
  const [headers, setHeaders] = useState([]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const response = await checkApi.checkFile(file);
      console.log(response.data);
      const jsonData = response.data || [];
      //Chuyển đổi JSON thành mảng 2D
      // Tiêu đề
      let headers = [...DEFAULT_HEADERS];

      // Thêm các trường mới từ 'others' vào tiêu đề
      if (jsonData.length > 0 && jsonData[0].others) {
        const otherFields = Object.keys(jsonData[0].others);
        headers = [...headers, ...otherFields];
      }
      // Chuyển đổi JSON thành mảng 2D
      const newData = [
        headers, // Hàng tiêu đề
        ...jsonData.map((item) => {
          const baseData = [
            item.sku || "",
            item.name || "",
            item.quantity || "",
            item.sellPrice || "",
            item.batchNumber || "",
            item.expiryDate || "",
            item.unit || "",
            item.unitPrice || "",
          ];

          // Thêm các trường mới từ 'others' vào dữ liệu
          if (item.others) {
            const otherValues = Object.values(item.others);
            return [...baseData, ...otherValues];
          }

          return baseData;
        }),
      ];
      setData([...newData]);
      setHeaders([...headers]);
    } catch (error) {
      console.log("Upload failed: " + error.response?.data || "Server error");
    }
  };

  // Xuất dữ liệu từ bảng tính ra file Excel
  const handleExport = () => {
    // Chuyển đổi dữ liệu từ React-Spreadsheet sang định dạng JSON
    const jsonData = data.map((row) => row.map((cell) => cell.value));
    const sheet = XLSX.utils.aoa_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    XLSX.writeFile(workbook, "spreadsheet_data.xlsx");
  };

  const formPos365 = () => {
    const newData = Array.from({ length: 20 }, () => Array(20).fill(""));
    newData[0] = DEFAULT_HEADERS.concat(Array(20 - headers.length).fill("")); // Đảm bảo độ dài hàng là 20
    setData(newData);
  };
  useEffect(() => {
    console.log(data);
  });

  const handleSave = () => {
    console.log("Lưu dữ liệu...");
  };
  const handleReset = () => {
    setData([]);
  };

  const addRow = () => {
    if (!hotRef.current) return;
    const hotInstance = hotRef.current.hotInstance;
    hotInstance.alter("insert_row_below", hotInstance.countRows());
  };

  const addColumn = () => {
    if (!hotRef.current) return;
    const hotInstance = hotRef.current.hotInstance;
    if (!hotInstance) return;

    hotInstance.alter("insert_col_end", hotInstance.countCols());
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">POS Demo</h1>
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={addRow}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Thêm Hàng
            </button>
            <button
              onClick={addColumn}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Thêm Cột
            </button>
          </div>

          <div className="flex gap-2">
            {/* Button Lưu */}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Lưu
            </button>

            {/* Button Tải file mẫu */}
            <button
              onClick={formPos365}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Mẫu POS365
            </button>

            {/* Button Mở file */}
            <label className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600">
              Mở file
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[550px] border border-gray-300">
        <HotTable
          ref={hotRef}
          data={data}
          rowHeaders={true}
          colHeaders={true}
          width="100%"
          height="auto"
          autoWrapRow={true}
          autoWrapCol={true}
          colWidths={120}
          manualColumnResize={true}
          manualRowResize={true}
          allowInsertColumn={true}
          contextMenu={contextMenuSettings}
          className="custom-table"
          cells={(row, col) => {
            const cellProperties = {};
            if (row === 0) {
              cellProperties.className = "custom-cell";
            }
            return cellProperties;
          }}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
    </div>
  );
};

const contextMenuSettings = {
  //   callback(key, selection, clickEvent) {
  //     console.log(key, selection, clickEvent);
  //   },
  items: {
    row_above: {
      disabled() {
        // `disabled` can be a boolean or a function
        // Disable option when first row was clicked
        return this.getSelectedLast()?.[0] === 0; // `this` === hot
      },
    },
    row_below: {},
    col_left: {},
    col_right: {},
    clear_column: {},
    remove_row: {},
    remove_col: {},
  },
};
const colHeaders = [
  "ID",
  "Full name",
  "Position",
  "Country",
  "City",
  "Address",
  "Zip code",
  "Mobile",
  "E-mail",
];
