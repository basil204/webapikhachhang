import express from "express";
import fetch from "node-fetch";
import { writeFileSync, readFileSync } from "fs";

const app = express();
const port = 3000;

// Địa chỉ liên kết CSV từ Google Sheets
const csvUrl =
  "https://docs.google.com/spreadsheets/d/1OMVBbiWjZeOFUMj9X_xRWIOVXRVIaHXDuDBvif1MvMc/export?format=csv";

// Hàm fetchData để tải dữ liệu từ Google Sheets và lưu vào file JSON
const fetchData = async () => {
  try {
    const response = await fetch(csvUrl);
    const csvData = await response.text();

    // Chuyển đổi dữ liệu CSV thành JSON
    const lines = csvData.split("\n");
    const result = {};

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(",");

      // Sử dụng cột A (chỉ số 0) làm khoá chính
      const primaryKey = currentLine[0]; // Cột A có chỉ số 0 (0-indexed)
      if (!primaryKey) continue; // Bỏ qua nếu không có giá trị ở cột A

      // Nếu khoá chính chưa tồn tại trong result, khởi tạo đối tượng mới
      if (!result[primaryKey]) {
        result[primaryKey] = {};
      }

      // Gộp dữ liệu từ cột A đến cột Z vào đối tượng cho khoá chính
      for (let j = 0; j < 26; j++) {
        const field = String.fromCharCode(65 + j);
        if (currentLine[j] !== undefined) {
          result[primaryKey][field] = currentLine[j];
        }
      }
    }

    // Ghi dữ liệu JSON vào file
    writeFileSync("data.json", JSON.stringify(result, null, 2));
    console.log(
      "Dữ liệu từ cột A đến cột Z đã được lưu vào data.json với cột A là khoá."
    );
  } catch (error) {
    console.error("Lỗi:", error);
  }
};

// Đọc dữ liệu từ file JSON
const getData = () => {
  try {
    const data = readFileSync("data.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Lỗi đọc file:", error);
    return {};
  }
};

// Endpoint /check
app.get("/check", async (req, res) => {
  const value = req.query.value;

  if (!value) {
    return res.status(400).json({ error: "Vui lòng cung cấp giá trị hợp lệ." });
  }

  // Tải dữ liệu từ CSV và ghi vào file JSON mỗi khi có yêu cầu
  await fetchData();

  // Lấy dữ liệu từ file JSON
  const data = getData();

  // Tìm kiếm dữ liệu theo cột W và trả về tất cả các kết quả
  const result = {};
  for (const [key, valueObj] of Object.entries(data)) {
    if (valueObj["W"] === value) {
      result[key] = valueObj;
    }
  }

  if (Object.keys(result).length > 0) {
    res.json(result);
  } else {
    res
      .status(404)
      .json({ error: "Không tìm thấy thông tin cho giá trị này trong cột W." });
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
