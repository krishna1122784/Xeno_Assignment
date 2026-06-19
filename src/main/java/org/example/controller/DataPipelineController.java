package org.example.controller;

import org.example.service.FileProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/api/pipeline")
@CrossOrigin(origins = "*")
public class DataPipelineController {

    @Autowired
    private FileProcessingService fileProcessingService;

    @PostMapping(value = "/process-universal", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Resource> processUniversalDataset(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectedColumns") String projectedColumns) {

        if (file.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();

        try {
            String[] targetColumns = projectedColumns.split(",");

            // Dynamic Universal Service Trigger
            ByteArrayOutputStream zipStream = fileProcessingService.parseAndFilterDocument(
                    file, targetColumns);

            ByteArrayResource resource = new ByteArrayResource(zipStream.toByteArray());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=custom_projections_data.zip")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}