package com.example.Tender.officer.service.cloudinary;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.Tender.officer.dto.cloudinary.CloudinaryUploadResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload a file (PDF, Image, Document) to Cloudinary.
     *
     * @param file   The multipart file to upload
     * @param folder Target folder inside Cloudinary (e.g., "tenders", "bids")
     * @return CloudinaryUploadResult containing secure_url, public_id, and metadata
     */
    public CloudinaryUploadResult uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File to upload must not be empty");
        }

        try {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String targetFolder = (folder != null && !folder.isBlank()) ? folder : "tenders";

            log.info("Uploading file '{}' to Cloudinary folder '{}'...", originalFilename, targetFolder);

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", targetFolder,
                            "resource_type", "auto",
                            "use_filename", true,
                            "unique_filename", true
                    )
            );

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");
            String format = (String) uploadResult.get("format");
            String resourceType = (String) uploadResult.get("resource_type");
            Long bytes = uploadResult.get("bytes") instanceof Number n ? n.longValue() : file.getSize();

            log.info("Cloudinary upload successful! Public ID: {}, Secure URL: {}", publicId, secureUrl);

            return CloudinaryUploadResult.builder()
                    .secureUrl(secureUrl)
                    .publicId(publicId)
                    .format(format)
                    .resourceType(resourceType)
                    .bytes(bytes)
                    .originalFilename(originalFilename)
                    .build();

        } catch (IOException e) {
            log.error("Cloudinary upload failed for file '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            throw new RuntimeException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Cloudinary upload encountered unexpected error: {}", e.getMessage(), e);
            throw new RuntimeException("Cloudinary upload error: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a file from Cloudinary by its public ID.
     */
    public boolean deleteFile(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return false;
        }

        try {
            log.info("Deleting file with publicId '{}' from Cloudinary...", publicId);
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            return "ok".equalsIgnoreCase(String.valueOf(result.get("result")));
        } catch (Exception e) {
            log.error("Failed to delete file with publicId '{}' from Cloudinary: {}", publicId, e.getMessage());
            return false;
        }
    }
}
