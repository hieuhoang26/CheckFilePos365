package org.posbe.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.posbe.dto.ProductDto;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.posbe.util.template.REQUIRED_COLUMNS;

@Service
public class ExcelService {
    private List<String> headerNames = new ArrayList<>();

    public List<ProductDto> processExcelFile(MultipartFile file) throws IOException {
        List<ProductDto> productList = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0); // Lấy sheet đầu tiên
            Row headerRow = sheet.getRow(0); // Đọc hàng tiêu đề (header)

            Map<String, Integer> columnIndexMap = new HashMap<>();
            for (Cell cell : headerRow) {
                String cleanedColumn = cell.getStringCellValue().replaceAll("\\(.*\\)", "").trim();
//                columnIndexMap.put(cell.getStringCellValue().trim(), cell.getColumnIndex());
                columnIndexMap.put(cleanedColumn, cell.getColumnIndex());
                headerNames.add(cleanedColumn);
            }
            // Kiểm tra file có đủ cột bắt buộc không
//            for (String required : REQUIRED_COLUMNS) {
//                if (!columnIndexMap.containsKey(required)) {
//                    throw new IllegalArgumentException("Thiếu cột mặc định: " + required);
//                }
//            }
            for (String required : REQUIRED_COLUMNS) {
                boolean found = false;
                for (String column : columnIndexMap.keySet()) {
                    // Loại bỏ phần thông tin trong ngoặc đơn
                    String cleanedColumn = column.replaceAll("\\(.*\\)", "").trim();
                    if (cleanedColumn.equals(required)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    throw new IllegalArgumentException("Thiếu cột mặc định: " + required);
                }
            }
//            if (!isValidHeader(headerRow)) {
//                throw new IllegalArgumentException("Cấu trúc file không hợp lệ! Vui lòng kiểm tra lại.");
//            }

            // Đọc dữ liệu từ hàng thứ 2 trở đi
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                ProductDto product = mapRowToProduct(row, i);
                productList.add(product);
            }
        }
        return productList;
    }
    private ProductDto mapRowToProduct(Row row, int rowIndex) {
        ProductDto product = new ProductDto();

        product.setSku(getCellValue(row.getCell(0))); // Mã hàng hóa
        product.setName(getCellValue(row.getCell(1))); // Tên hàng hóa
        product.setQuantity((int) getNumericCellValue(row.getCell(2), rowIndex, "SL")); // Số lượng
        product.setUnitPrice(BigDecimal.valueOf(getNumericCellValue(row.getCell(3), rowIndex, "Đơn giá"))); // Đơn giá
        product.setBatchNumber(getCellValue(row.getCell(4))); // Số Lô
        product.setExpiryDate(parseDateCell(row.getCell(5), rowIndex)); // Hạn sử dụng
        product.setUnit(getCellValue(row.getCell(6))); // Đơn vị tính (ĐVT)
        product.setSellPrice(BigDecimal.valueOf(getNumericCellValue(row.getCell(7), rowIndex, "Giá bán"))); // Giá bán
        // Lưu các cột bổ sung
        Map<String, Object> extraFields = new HashMap<>();
        for (int colIndex = 0; colIndex < row.getLastCellNum(); colIndex++) {
            if (colIndex >= headerNames.size()) continue; // Bỏ qua cột không có tiêu đề
            String columnName = headerNames.get(colIndex);
            if (!REQUIRED_COLUMNS.contains(columnName)) {
                extraFields.put(columnName, getCellValue(row.getCell(colIndex)));
            }
        }
        product.setOthers(extraFields);
        // Kiểm tra dữ liệu hợp lệ
        validateProduct(product, rowIndex);
        return product;
    }


    // Lấy giá trị String từ ô Excel
    private String getCellValue(Cell cell) {
//        return cell != null ? cell.getStringCellValue().trim() : "";
        if (cell == null) return "";
        // Chuyển số thành chuỗi
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield new SimpleDateFormat("yyyy-MM-dd").format(cell.getDateCellValue());
                }
                yield String.valueOf(cell.getNumericCellValue()); // Nếu là ngày tháng
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> String.valueOf(cell.getNumericCellValue()); // Nếu là công thức, lấy giá trị số
            default -> "";
        };
    }

    // Lấy giá trị số từ ô Excel
    private double getNumericCellValue(Cell cell, int rowIndex, String columnName) {
        if (cell == null) {
            throw new IllegalArgumentException("Lỗi ở dòng " + (rowIndex + 1)  + ": " + columnName + " không được để trống.");
        }

        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return Double.parseDouble(cell.getStringCellValue().trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Lỗi ở dòng " + (rowIndex + 1)  + ": " + columnName + " phải là số hợp lệ.");
            }
        } else {
            throw new IllegalArgumentException("Lỗi ở dòng " + (rowIndex + 1)  + ": " + columnName + " có dữ liệu không hợp lệ.");
        }
    }

    // Chuyển đổi ngày từ Excel sang LocalDate
//    private LocalDate parseDateCell(Cell cell, int rowIndex) {
//        if (cell == null || cell.getCellType() != CellType.NUMERIC) {
//            throw new IllegalArgumentException("Lỗi dòng " + (rowIndex + 1)  + ": Hạn sử dụng không hợp lệ.");
//        }
//        return cell.getLocalDateTimeCellValue().toLocalDate();
//    }
    private LocalDate parseDateCell(Cell cell, int rowIndex) {
        if (cell == null) {
            throw new IllegalArgumentException("Lỗi dòng " + (rowIndex + 1) + ": Hạn sử dụng không hợp lệ.");
        }

        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        } else if (cell.getCellType() == CellType.STRING) {
            String dateString = cell.getStringCellValue().trim();

            // Danh sách các định dạng ngày hỗ trợ
            List<DateTimeFormatter> formatters = List.of(
                    DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                    DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                    DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                    DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                    DateTimeFormatter.ofPattern("yyyy/MM/dd")
            );

            for (DateTimeFormatter formatter : formatters) {
                try {
                    return LocalDate.parse(dateString, formatter);
                } catch (DateTimeParseException e) {
                    // Bỏ qua lỗi, thử định dạng tiếp theo
                }
            }
        }

        throw new IllegalArgumentException("Lỗi dòng " + (rowIndex + 1) + ": Định dạng ngày không hợp lệ.");
    }



    private String normalizeHeader(Cell cell) {
        if (cell == null || cell.getCellType() != CellType.STRING) return "";
        return cell.getStringCellValue().trim().replaceAll("\\s+", " ");
    }

    private void validateProduct(ProductDto product, int rowIndex) {
        if (product.getSku().isEmpty()) {
            throw new IllegalArgumentException("Lỗi dòng " + (rowIndex+1) + ": Mã hàng hóa không được để trống.");
        }
        if (product.getName().isEmpty()) {
            throw new IllegalArgumentException("Lỗi dòng " + (rowIndex+1) + ": Tên hàng hóa không được để trống.");
        }
        if (product.getQuantity() < 0) {
            throw new IllegalArgumentException("Lỗi dòng " + (rowIndex+1) + ": Số lượng không thể âm.");
        }
        if (product.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Lỗi dòng " + (rowIndex+1) + ": Đơn giá không thể âm.");
        }
        if (product.getSellPrice().compareTo(product.getUnitPrice()) < 0) {
            throw new IllegalArgumentException("Lỗi dòng " + (rowIndex+1) + ": Giá bán phải lớn hơn đơn giá.");
        }
//        if (product.getExpiryDate().isBefore(LocalDate.now())) {
//            throw new IllegalArgumentException("Lỗi dòng " + (rowIndex+1) + ": Hạn sử dụng phải lớn hơn ngày hiện tại.");
//        }
    }



}
