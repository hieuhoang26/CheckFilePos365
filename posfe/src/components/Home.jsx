import { useState } from "react";
import Spreadsheet from "react-spreadsheet";
import * as XLSX from "xlsx";
import { checkApi } from "../api/check";

export const Home = () => {
  // 20 row và 40 col
  const [data, setData] = useState(
    Array.from({ length: 30 }, (_, row) =>
      Array.from({ length: 40 }, (_, col) => ({
        value: "",
        color: row % 2 === 0 ? "#f0f0f0" : "#d1e7dd",
      }))
    )
  );

  // Xử lý khi người dùng tải lên file Excel
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const response = await checkApi.checkFile(file);
      console.log(response.data);
      const jsonData = response.data;
      //Chuyển đổi JSON thành mảng 2D
      const headers = [
        "Mã hàng hóa",
        "Tên hàng hóa",
        "SL",
        "Đơn giá",
        "Số Lô",
        "Hạn sử dụng (12/24/2050)",
        "ĐVT",
        "Giá bán",
      ];

      // Tạo một mảng mới
      const newData = Array.from({ length: 30 }, () =>
        Array.from({ length: 40 }, () => ({
          value: "",
        }))
      );
      headers.forEach((header, colIndex) => {
        newData[0][colIndex].value = header;
      });

      jsonData.forEach((item, rowIndex) => {
        newData[rowIndex + 1][0].value = item.sku || "";
        newData[rowIndex + 1][1].value = item.name || "";
        newData[rowIndex + 1][2].value = item.quantity || "";
        newData[rowIndex + 1][3].value = item.sellPrice || "";
        newData[rowIndex + 1][4].value = item.batchNumber || "";
        newData[rowIndex + 1][5].value = item.expiryDate || "";
        newData[rowIndex + 1][6].value = item.unit || "";
        newData[rowIndex + 1][7].value = item.unitPrice || "";
      });
      setData(newData);
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

  const handleSave = () => {
    console.log("Lưu dữ liệu...");
  };

  const handleReset = () => {
    setData(
      Array.from({ length: 30 }, () =>
        Array.from({ length: 40 }, () => ({ value: "" }))
      )
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">POS Demo</h1>
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Lưu
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tải file mẫu
        </button>
        <label className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
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
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reset
        </button>
      </div>

      <div className="overflow-auto max-h-[550px] border border-gray-300">
        <Spreadsheet data={data} onChange={setData} />
      </div>
    </div>
  );
};

// const CustomCell = ({ cell = {}, getValue, setValue }) => {
//   return (
//     <input
//       className=" text-center border-none outline-none"
//       style={{
//         backgroundColor: cell.color || "white", // Kiểm tra `cell.color`
//         color: "black",
//         padding: "5px",
//       }}
//       // value={getValue() || ""}
//       onChange={(e) => setValue(e.target.value)}
//     />
//   );
// };
