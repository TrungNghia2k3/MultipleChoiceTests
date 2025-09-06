const fs = require('fs');
const path = require('path');

// Đọc file exam-3.txt và chuyển đổi thành JSON
function convertExamToJson() {
    try {
        // Đọc nội dung file
        const examContent = fs.readFileSync('exam-3.txt', 'utf8');
        
        // Tách từng câu hỏi bằng cách tìm pattern số + dấu chấm
        const questionBlocks = examContent.split(/(?=\n\d+\.)/);
        
        const questions = [];
        let questionId = 1;
        
        for (let block of questionBlocks) {
            block = block.trim();
            if (!block) continue;
            
            const lines = block.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length === 0) continue;
            
            // Tìm câu hỏi (dòng đầu tiên)
            const questionLine = lines[0];
            const questionMatch = questionLine.match(/^\d+\.\s*(.*)/);
            
            if (!questionMatch) continue;
            
            const questionText = questionMatch[1];
            const options = [];
            let answer = "";
            
            // Tìm các option và answer
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                
                // Kiểm tra nếu là option (A, B, C, D)
                if (line.match(/^[A-D]\.\s*/)) {
                    options.push(line);
                }
                // Kiểm tra nếu là answer
                else if (line.startsWith('Answer:')) {
                    answer = line.replace('Answer:', '').trim();
                }
            }
            
            // Chỉ thêm câu hỏi nếu có đủ thông tin
            if (questionText && options.length >= 4 && answer) {
                questions.push({
                    id: questionId++,
                    question: questionText,
                    options: options,
                    answer: answer
                });
            }
        }
        
        // Tạo đối tượng exam theo format chuẩn
        const examData = {
            id: 3,
            title: "Đề số 3 - Tin học cơ bản",
            questions: questions
        };
        
        // Ghi ra file JSON với định dạng đẹp
        fs.writeFileSync('exam-3.json', JSON.stringify(examData, null, 4), 'utf8');
        
        console.log(`✅ Đã chuyển đổi thành công!`);
        console.log(`📝 Tổng số câu hỏi: ${questions.length}`);
        console.log(`📁 File được tạo: exam-3.json`);
        
        // Hiển thị vài câu hỏi đầu để kiểm tra
        console.log('\n🔍 Xem trước 3 câu hỏi đầu:');
        questions.slice(0, 3).forEach((q, index) => {
            console.log(`\n📌 Câu ${index + 1}: ${q.question}`);
            q.options.forEach(option => console.log(`   ${option}`));
            console.log(`   ✅ Đáp án: ${q.answer}`);
        });
        
        console.log('\n🎯 Bạn có thể copy nội dung file exam-3.json vào exams.json!');
        
        return examData;
        
    } catch (error) {
        console.error('❌ Lỗi khi chuyển đổi:', error.message);
        return null;
    }
}

// Chạy function chuyển đổi
convertExamToJson();
