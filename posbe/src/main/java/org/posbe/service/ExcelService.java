package org.posbe.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.posbe.dto.ProductDto;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelService {
    public List<ProductDto> processExcelFile(MultipartFile file) throws IOException {
        List<ProductDto> productList = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0); // Lấy sheet đầu tiên

            // Đọc hàng tiêu đề (header)
            Row headerRow = sheet.getRow(0);
            if (!isValidHeader(headerRow)) {
                throw new IllegalArgumentException("Cấu trúc file không hợp lệ! Vui lòng kiểm tra lại.");
            }

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

        // Kiểm tra dữ liệu hợp lệ
        validateProduct(product, rowIndex);

        return product;
    }


    // Lấy giá trị String từ ô Excel
    private String getCellValue(Cell cell) {
        return cell != null ? cell.getStringCellValue().trim() : "";
    }

    // Lấy giá trị số từ ô Excel
    private double getNumericCellValue(Cell cell, int rowIndex, String columnName) {
        if (cell == null) {
            throw new IllegalArgumentException("Lỗi ở dòng " + rowIndex + ": " + columnName + " không được để trống.");
        }

        switch (cell.getCellType()) {
            case NUMERIC:
                return cell.getNumericCellValue();
            case STRING:
                try {
                    return Double.parseDouble(cell.getStringCellValue().trim());
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Lỗi ở dòng " + rowIndex + ": " + columnName + " phải là số hợp lệ.");
                }
            case BLANK:
                throw new IllegalArgumentException("Lỗi ở dòng " + rowIndex + ": " + columnName + " không được để trống.");
            default:
                throw new IllegalArgumentException("Lỗi ở dòng " + rowIndex + ": " + columnName + " có dữ liệu không hợp lệ.");
        }
    }


    // Chuyển đổi ngày từ Excel sang LocalDate
    private LocalDate parseDateCell(Cell cell, int rowIndex) {
        if (cell == null || cell.getCellType() != CellType.NUMERIC) {
            throw new IllegalArgumentException("Lỗi dòng " + rowIndex + ": Hạn sử dụng không hợp lệ.");
        }
        return cell.getLocalDateTimeCellValue().toLocalDate();
    }
    private boolean isValidHeader(Row headerRow) {
        if (headerRow == null) {
            System.out.println("LỖI: Dòng tiêu đề bị null!");
            return false;
        }

        // Log giá trị từng cột để kiểm tra
//        for (int i = 0; i < 8; i++) {
//            Cell cell = headerRow.getCell(i);
//            String value = (cell != null) ? normalizeHeader(cell) : "NULL";
//            System.out.println("Cột " + i + ": '" + value + "'");
//        }

        return normalizeHeader(headerRow.getCell(0)).equals("Mã hàng hóa") &&
                normalizeHeader(headerRow.getCell(1)).equals("Tên hàng hóa") &&
                normalizeHeader(headerRow.getCell(2)).equals("SL") &&
                normalizeHeader(headerRow.getCell(3)).equals("Đơn giá") &&
                normalizeHeader(headerRow.getCell(4)).equals("Số Lô") &&
                normalizeHeader(headerRow.getCell(5)).contains("Hạn sử dụng") &&
                normalizeHeader(headerRow.getCell(6)).equals("ĐVT") &&
                normalizeHeader(headerRow.getCell(7)).equals("Giá bán");
    }


    private String normalizeHeader(Cell cell) {
        if (cell == null || cell.getCellType() != CellType.STRING) return "";
        return cell.getStringCellValue().trim().replaceAll("\\s+", " ");
    }

    private void validateProduct(ProductDto product, int rowIndex) {
        if (product.getSku().isEmpty()) {
            throw new IllegalArgumentException("Lỗi dòng " + rowIndex + ": Mã hàng hóa không được để trống.");
        }
        if (product.getName().isEmpty()) {
            throw new IllegalArgumentException("Lỗi dòng " + rowIndex + ": Tên hàng hóa không được để trống.");
        }
        if (product.getQuantity() < 0) {
            throw new IllegalArgumentException("Lỗi dòng " + rowIndex + ": Số lượng không thể âm.");
        }
        if (product.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Lỗi dòng " + rowIndex + ": Đơn giá không thể âm.");
        }
        if (product.getSellPrice().compareTo(product.getUnitPrice()) < 0) {
            throw new IllegalArgumentException("Lỗi dòng " + rowIndex + ": Giá bán phải lớn hơn đơn giá.");
        }
        if (product.getExpiryDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Lỗi dòng " + rowIndex + ": Hạn sử dụng phải lớn hơn ngày hiện tại.");
        }
    }



}
