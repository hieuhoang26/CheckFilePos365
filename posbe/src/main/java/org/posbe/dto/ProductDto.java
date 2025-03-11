package org.posbe.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Data
public class ProductDto {
    private String sku;           // Mã hàng hóa
    private String name;          // Tên hàng hóa
    private int quantity;         // Số lượng (SL)
    private BigDecimal unitPrice; // Đơn giá
    private String batchNumber;   // Số Lô
    private LocalDate expiryDate; // Hạn sử dụng
    private String unit;          // Đơn vị tính (ĐVT)
    private BigDecimal sellPrice; // Giá bán
}
