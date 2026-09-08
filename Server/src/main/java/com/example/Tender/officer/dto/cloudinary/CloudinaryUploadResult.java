package com.example.Tender.officer.dto.cloudinary;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CloudinaryUploadResult {

    private String secureUrl;
    private String publicId;
    private String format;
    private String resourceType;
    private Long bytes;
    private String originalFilename;
}
