package org.example.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class FileProcessingService {

    private static final int CHUNK_SIZE = 2000;

    public ByteArrayOutputStream parseAndFilterDocument(MultipartFile file, String[] targetColumns) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        List<String[]> rawMatrix = new ArrayList<>();
        String filename = file.getOriginalFilename().toLowerCase();

        // 1. FILE FORMAT INGESTION LAYER
        if (filename.endsWith(".csv")) {
            parseCSV(file.getInputStream(), rawMatrix);
        } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            parseExcel(file.getInputStream(), rawMatrix);
        } else {
            throw new IllegalArgumentException("Unsupported data format.");
        }

        if (rawMatrix.isEmpty()) throw new IllegalStateException("Empty parsed dataset workspace.");

        // 2. SCHEMA EXTRACTION & INDEX LOOKUP
        String[] originalHeaders = rawMatrix.get(0);
        int[] targetIndices = new int[targetColumns.length];
        for (int i = 0; i < targetColumns.length; i++) {
            targetIndices[i] = -1;
            for (int j = 0; j < originalHeaders.length; j++) {
                if (originalHeaders[j].trim().equalsIgnoreCase(targetColumns[i].trim())) {
                    targetIndices[i] = j;
                    break;
                }
            }
            if (targetIndices[i] == -1) targetIndices[i] = 0;
        }

        // 3. TARGET EXCEL WRITER & CHUNKING ENGINE
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            int chunkIndex = 1;
            int fileSliceCount = 0;

            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Filtered Projections");

            // Create a specific text style to force full phone numbers formatting
            CellStyle textStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            textStyle.setDataFormat(format.getFormat("@")); // '@' forces Excel to render cells as TEXT string literal

            createPremiumHeader(workbook, sheet, targetColumns);
            int currentExcelRow = 1;

            for (int i = 1; i < rawMatrix.size(); i++) {
                String[] currentRowData = rawMatrix.get(i);

                Row excelRow = sheet.createRow(currentExcelRow++);
                for (int cellIdx = 0; cellIdx < targetIndices.length; cellIdx++) {
                    int dataPointer = targetIndices[cellIdx];
                    String cellVal = (dataPointer < currentRowData.length) ? currentRowData[dataPointer] : "";

                    Cell cell = excelRow.createCell(cellIdx);
                    cell.setCellValue(cellVal);

                    // Force text formatting on all phone or general selection items
                    cell.setCellStyle(textStyle);
                }
                fileSliceCount++;

                if (fileSliceCount % CHUNK_SIZE == 0) {
                    autoFitColumns(sheet, targetColumns.length);
                    writeExcelToZip(zos, workbook, "projected_clean_chunk_" + chunkIndex + ".xlsx");
                    chunkIndex++;

                    workbook = new XSSFWorkbook();
                    sheet = workbook.createSheet("Filtered Projections");
                    textStyle = workbook.createCellStyle();
                    textStyle.setDataFormat(workbook.createDataFormat().getFormat("@"));

                    createPremiumHeader(workbook, sheet, targetColumns);
                    currentExcelRow = 1;
                }
            }

            if (currentExcelRow > 1) {
                autoFitColumns(sheet, targetColumns.length);
                writeExcelToZip(zos, workbook, "projected_clean_chunk_" + chunkIndex + ".xlsx");
            }
            workbook.close();
        }

        return baos;
    }

    private void parseCSV(InputStream is, List<String[]> matrix) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty() || line.replaceAll(",", "").trim().isEmpty()) continue;
                matrix.add(line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)"));
            }
        }
    }

    private void parseExcel(InputStream is, List<String[]> matrix) throws IOException {
        try (Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheetAt(0);
            for (Row row : sheet) {
                List<String> cells = new ArrayList<>();
                for (int c = 0; c < row.getLastCellNum(); c++) {
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    // Standard cell string evaluation without formatting corruptions
                    if (cell.getCellType() == CellType.NUMERIC) {
                        cells.add(String.format("%.0f", cell.getNumericCellValue()));
                    } else {
                        cells.add(cell.toString());
                    }
                }
                matrix.add(cells.toArray(new String[0]));
            }
        }
    }

    private void createPremiumHeader(Workbook wb, Sheet sheet, String[] headers) {
        Row hRow = sheet.createRow(0);
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.TEAL.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = hRow.createCell(i);
            cell.setCellValue(headers[i].toUpperCase().trim());
            cell.setCellStyle(style);
        }
    }

    private void autoFitColumns(Sheet sheet, int len) {
        for (int i = 0; i < len; i++) sheet.autoSizeColumn(i);
    }

    private void writeExcelToZip(ZipOutputStream zos, Workbook wb, String name) throws IOException {
        ZipEntry entry = new ZipEntry(name);
        zos.putNextEntry(entry);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        wb.write(bos);
        zos.write(bos.toByteArray());
        zos.closeEntry();
    }
}