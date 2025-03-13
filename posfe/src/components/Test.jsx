import React, { useEffect, useRef, useState } from "react";
import { HotColumn, HotTable } from "@handsontable/react";
import * as XLSX from "xlsx";
import { checkApi } from "../api/check";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import "./Test.css";
import { DEFAULT_HEADERS } from "../util/constant";
import { handleExportWithTemplate } from "./ExportExcel";
import { ExportModal } from "./ExportModal";
import { toast } from "react-toastify";

registerAllModules();

export const Test = () => {
  const hotRef = useRef(null);
  const [data, setData] = useState(
    Array.from({ length: 9 }, () => Array(9).fill(""))
  );
  const [headers, setHeaders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedRows, setHighlightedRows] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      toast.warning("Upload failed: " + error.response?.data || "Server error");
    }
  };

  const formPos365 = () => {
    const newData = Array.from({ length: 10 }, () => Array(10).fill(""));
    newData[0] = DEFAULT_HEADERS.concat(Array(10 - headers.length).fill("")); // Đảm bảo độ dài hàng là 20
    setData(newData);
  };
  useEffect(() => {
    console.log(data);
  });
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (hotRef.current) {
      const hotInstance = hotRef.current.hotInstance;
      const search = hotInstance.getPlugin("search");
      const searchResult = search.query(query);
      // console.log("Kết quả tìm kiếm:", searchResult);
      // row có kết quả tìm kiếm
      const matchedRows = new Set(searchResult.map((result) => result.row));
      setHighlightedRows(matchedRows);
      hotInstance.render(); // Cập nhật bảng sau khi tìm kiếm
    }
  };
  const handleReset = () => {
    setData(Array.from({ length: 10 }, () => Array(10).fill("")));
  };
  // Xuất dữ liệu từ bảng tính ra file Excel
  const handleExport = () => {
    // const jsonData = data.map((row) => row.map((cell) => cell.value || ""));
    const jsonData = data;
    console.log("excel", jsonData);
    const worksheet = XLSX.utils.aoa_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "spreadsheet_data.xlsx");
  };
  const handleExportDemo = (selectedColumns) => {
    const columnIndexes = selectedColumns.map((col) => data[0].indexOf(col));
    const filteredData = data.map((row) =>
      columnIndexes.map((index) => row[index])
    );
    const worksheet = XLSX.utils.aoa_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "filtered_data.xlsx");
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
            <input
              type="text"
              className="border p-2 mb-2"
              placeholder="Nhập từ khóa tìm kiếm..."
              value={searchQuery}
              onChange={handleSearch}
            />
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
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Xuất File
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Tuỳ chọn
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
          search={true}
          manualRowResize={true}
          allowInsertColumn={true}
          contextMenu={contextMenuSettings}
          className="custom-table"
          beforeChange={handleBeforeChange}
          cells={(row, col) => {
            const cellProperties = {};
            if (row === 0) {
              cellProperties.className = "custom-cell";
            }
            if (highlightedRows.has(row)) {
              cellProperties.className = "highlight-search";
            }
            // Validation cho cột bắt buộc (cột 0, 1, 6)
            if ([0, 1, 6].includes(col)) {
              cellProperties.validator = function (value, callback) {
                if (!value || value.trim() === "") {
                  callback(false); // Không hợp lệ
                } else {
                  callback(true); // Hợp lệ
                }
              };
            }
            // Validation cho Số lượng (SL) - cột 2
            if (col === 2) {
              cellProperties.validator = function (value, callback) {
                const numericValue = Number(value);
                if (isNaN(numericValue)) {
                  callback(false); // Không phải số
                } else if (!Number.isInteger(numericValue)) {
                  callback(false); // Không phải số nguyên
                } else if (numericValue <= 0) {
                  callback(false); // Không phải số nguyên dương
                } else {
                  callback(true); // Hợp lệ
                }
              };
            }
            // Validation cho Đơn giá & Giá bán - cột 3, 7
            if ([3, 7].includes(col)) {
              cellProperties.validator = function (value, callback) {
                const numericValue = Number(value);
                if (isNaN(numericValue)) {
                  callback(false); // Không phải số
                } else if (numericValue <= 0) {
                  callback(false); // Không phải số dương
                } else {
                  callback(true); // Hợp lệ
                }
              };
            }
            // Validation cho Hạn sử dụng - cột 5
            if (col === 5) {
              cellProperties.validator = function (value, callback) {
                const regex = /^\d{2}\/\d{2}\/\d{4}$/; // Định dạng MM/DD/YYYY
                if (!regex.test(value)) {
                  callback(false); // Không hợp lệ
                } else {
                  callback(true); // Hợp lệ
                }
              };
            }

            return cellProperties;
          }}
          afterValidate={(isValid, value, row, col, validationResult) => {
            if (!isValid) {
              console.log(
                `Giá trị không hợp lệ tại hàng ${row}, cột ${col}: ${value}`
              );
              alert(
                `Giá trị không hợp lệ tại hàng ${row}, cột ${col}: ${value}`
              );
            }
          }}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
      {isModalOpen && (
        <ExportModal
          columns={data[0]}
          onExport={handleExportDemo}
          onClose={() => setIsModalOpen(false)}
        />
      )}
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
      name: "Thêm hàng trên ",
    },
    row_below: {
      name: "Thêm hàng dưới ",
    },
    col_left: {},
    col_right: {},
    clear_column: {},
    remove_row: {},
    remove_col: {},
  },
};

const handleBeforeChange = (changes, source) => {
  if (source === "edit") {
    const hasError = changes.some(([row, col, oldValue, newValue]) => {
      // Kiểm tra giá trị rỗng ở các cột bắt buộc
      if ([0, 1, 6].includes(col) && (!newValue || newValue.trim() === "")) {
        alert(`Cột ${col + 1} không được để trống!`);
        return true;
      }

      // Kiểm tra Số lượng (SL) - phải là số nguyên dương
      if (col === 2) {
        const numericValue = Number(newValue);
        if (
          isNaN(numericValue) ||
          !Number.isInteger(numericValue) ||
          numericValue <= 0
        ) {
          alert(`Cột ${col + 1} phải là số nguyên dương!`);
          return true;
        }
      }

      // Kiểm tra Đơn giá & Giá bán - phải là số dương
      if ([3, 7].includes(col)) {
        const numericValue = Number(newValue);
        if (isNaN(numericValue) || numericValue <= 0) {
          alert(`Cột ${col + 1} phải là số dương!`);
          return true;
        }
      }

      // Kiểm tra Hạn sử dụng - định dạng MM/DD/YYYY
      if (col === 5 && !/^\d{2}\/\d{2}\/\d{4}$/.test(newValue)) {
        alert(`Cột ${col + 1} phải có định dạng MM/DD/YYYY!`);
        return true;
      }

      return false;
    });

    if (hasError) return false;
  }
};
