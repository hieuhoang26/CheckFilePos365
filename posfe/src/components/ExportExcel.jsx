// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";

// export const handleExportWithTemplate = async (data) => {
//   try {
//     // 1️⃣ Đọc file mẫu từ public/template.xlsx
//     const response = await fetch("/PO.xlsx");
//     const arrayBuffer = await response.arrayBuffer();
//     const workbook = XLSX.read(arrayBuffer, { type: "array" });

//     let worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Lấy sheet đầu tiên
//     let templateHeaders = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0]; // Lấy tiêu đề từ file mẫu

//     console.log("📌 Tiêu đề trong file mẫu:", templateHeaders);

//     // 2️⃣ Lấy tiêu đề từ dữ liệu hiện tại
//     let dataHeaders = data[0]; // Tiêu đề của dữ liệu đầu vào

//     console.log("📌 Tiêu đề từ dữ liệu:", dataHeaders);

//     // 3️⃣ Ghép dữ liệu theo tiêu đề file mẫu
//     let formattedData = data.slice(1).map((row) => {
//       let newRow = [];
//       templateHeaders.forEach((header, index) => {
//         let colIndex = dataHeaders.indexOf(header); // Tìm vị trí của tiêu đề trong dữ liệu
//         newRow[index] = colIndex !== -1 ? row[colIndex] : ""; // Nếu không tìm thấy thì để trống
//       });
//       return newRow;
//     });

//     // 4️⃣ Nếu dữ liệu có thêm cột mới, bổ sung vào tiêu đề file mẫu
//     dataHeaders.forEach((header) => {
//       if (!templateHeaders.includes(header)) {
//         templateHeaders.push(header);
//       }
//     });

//     // 5️⃣ Ghi dữ liệu vào sheet (bắt đầu từ A1)
//     XLSX.utils.sheet_add_aoa(worksheet, [templateHeaders, ...formattedData], {
//       origin: "A1",
//     });
//     // 6️⃣ Xuất file Excel mới
//     const updatedFile = XLSX.write(workbook, {
//       bookType: "xlsx",
//       type: "array",
//     });
//     saveAs(new Blob([updatedFile]), "exported_data.xlsx");

//     console.log("✅ Xuất file thành công!");
//   } catch (error) {
//     console.error("❌ Lỗi khi xuất file Excel:", error);
//   }
// };
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const handleExportWithTemplate = async (data) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("public/PO.xlsx"); // Đọc file mẫu (đảm bảo file có sẵn)

  const worksheet = workbook.getWorksheet(1); // Lấy sheet đầu tiên

  // Ghi dữ liệu vào các ô và giữ nguyên định dạng
  data.forEach((row, rowIndex) => {
    row.forEach((cellValue, colIndex) => {
      const cell = worksheet.getCell(rowIndex + 1, colIndex + 1);
      cell.value = cellValue;
    });
  });

  // Xuất file mới dưới dạng blob để tải về trình duyệt
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "exported_data.xlsx");
  console.log("✅ File exported successfully!");
};

export default handleExportWithTemplate;
