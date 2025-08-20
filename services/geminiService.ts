
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "Một điểm số phần trăm từ 0 đến 100, được tính bằng (số lượng ký tự đúng / độ dài của bản ghi chính xác) * 100, làm tròn đến số nguyên gần nhất. Hãy nghiêm khắc và chính xác.",
    },
    comparison: {
      type: Type.ARRAY,
      description: "Một sự so sánh chi tiết, từng ký tự một dựa trên thuật toán diff.",
      items: {
        type: Type.OBJECT,
        properties: {
          correctChar: {
            type: Type.STRING,
            description: "Ký tự từ bản ghi chính xác. Chuỗi rỗng cho một ký tự thừa từ người dùng."
          },
          userChar: {
            type: Type.STRING,
            description: "Ký tự từ văn bản của người dùng. Chuỗi rỗng nếu người dùng thiếu một ký tự."
          },
          status: {
            type: Type.STRING,
            description: "Trạng thái phải là một trong các giá trị: 'correct', 'incorrect', 'missing', 'extra'."
          },
          explanation: {
            type: Type.STRING,
            description: "Một lời giải thích ngắn gọn, mang tính sư phạm về lý do tại sao ký tự của người dùng không chính xác. Trường này CHỈ nên được cung cấp nếu trạng thái là 'incorrect'. Đối với tất cả các trạng thái khác, trường này phải được bỏ qua."
          }
        },
        required: ["correctChar", "userChar", "status"],
      }
    }
  },
  required: ["score", "comparison"],
};

export const analyzeDictation = async (correctTranscript: string, userText: string): Promise<AnalysisResult> => {
  const prompt = `
    Bạn là một AI chấm bài chính tả tiếng Trung chuyên nghiệp, nghiêm khắc và cực kỳ chính xác. Chức năng chính của bạn là thực hiện so sánh chi tiết, từng ký tự một, giữa văn bản của người dùng và một bản ghi chính xác, đồng thời cung cấp phản hồi mang tính sư phạm. Các văn bản có thể rất dài (hàng nghìn ký tự) và bạn phải duy trì độ chính xác 100% trong việc so sánh. Bạn PHẢI tạo ra một đối tượng JSON tuân thủ schema được cung cấp mà không có bất kỳ sai lệch nào.

    - Bản ghi chính xác: "${correctTranscript}"
    - Văn bản của người dùng: "${userText}"

    Tuân thủ các quy tắc này với độ chính xác tuyệt đối:
    1.  **Thuật toán**: Sử dụng một thuật toán giống như diff phức tạp để so sánh tỉ mỉ hai văn bản, từng ký tự một, từ đầu đến cuối.
    2.  **Trùng khớp chính xác**: Đối với một ký tự trùng khớp hoàn hảo theo trình tự: { correctChar: "字", userChar: "字", status: "correct" }.
    3.  **Ký tự không chính xác**: Đối với một ký tự khác ở cùng một vị trí: { correctChar: "正", userChar: "错", status: "incorrect", explanation: "Cung cấp một lý do ngắn gọn, hữu ích bằng tiếng Việt ở đây." }.
    4.  **Ký tự bị thiếu**: Đối với một ký tự tồn tại trong bản ghi chính xác nhưng bị thiếu trong văn bản của người dùng (người dùng xóa): { correctChar: "字", userChar: "", status: "missing" }.
    5.  **Ký tự thừa**: Đối với một ký tự thừa trong văn bản của người dùng không khớp với bản ghi chính xác (người dùng chèn): { correctChar: "", userChar: "多", status: "extra" }.
    6.  **Giải thích lỗi**: **Điều quan trọng nhất**, đối với mỗi ký tự có trạng thái 'incorrect', bạn BẮT BUỘC phải cung cấp một 'explanation' (lời giải thích) ngắn gọn và hữu ích **bằng tiếng Việt**. Lời giải thích này phải làm rõ tại sao ký tự của người dùng lại sai. Ví dụ: "Ký tự này có âm tương tự nhưng nghĩa khác", "Đây là một lỗi chính tả phổ biến cho ký tự đúng", hoặc "Ký tự bạn đã dùng không chính xác trong ngữ cảnh này." Lời giải thích phải mang tính sư phạm và giúp người dùng học hỏi.
    7.  **Tính toàn vẹn của chuỗi**: Mảng 'comparison' cuối cùng phải đại diện cho một chuỗi hoàn chỉnh và mạch lạc của cả hai văn bản kết hợp, bảo toàn thứ tự của các thao tác (đúng, sai, thiếu, thừa).
    8.  **Tính điểm**: 'score' phải được tính toán với độ chính xác toán học. Công thức là: (tổng số mục có trạng thái 'correct') / (tổng số ký tự trong Bản ghi chính xác). Kết quả sau đó được nhân với 100 và làm tròn đến số nguyên gần nhất. Nếu bản ghi chính xác trống, điểm phải là 0. Không đi chệch khỏi phương pháp tính toán này. Không có điểm một phần.
    9.  **XỬ LÝ KHOẢNG TRẮNG NGHIÊM NGẶT**: Đây là quy tắc quan trọng nhất và phải được tuân thủ tuyệt đối cho mọi ký tự, bất kể văn bản dài đến đâu. Tất cả các ký tự khoảng trắng—bao gồm dấu cách (' '), dấu xuống dòng ('\\n'), và tab ('\\t')—PHẢI được coi là các ký tự thông thường và được so sánh chính xác. Chúng không bao giờ được bỏ qua, chuẩn hóa, hay thay đổi dưới bất kỳ hình thức nào. Nếu bản ghi chính xác có một dấu xuống dòng và người dùng không có, đó là lỗi 'missing' với correctChar là '\\n'. Nếu người dùng có một dấu cách thừa, đó là lỗi 'extra' với userChar là ' '. Không có ngoại lệ. Việc tuân thủ quy tắc này là tối quan trọng để đảm bảo tính toàn vẹn 100% của việc chấm điểm định dạng.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing dictation with Gemini:", error);
    throw new Error("Không thể nhận được phân tích hợp lệ từ AI. Vui lòng kiểm tra console để biết chi tiết.");
  }
};
