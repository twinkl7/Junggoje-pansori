import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const projectDescriptionSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    suggestedType: { type: Type.STRING, description: "One of: Upcoming, Past" },
    keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "description", "suggestedType", "keyThemes"]
};

export async function generateProjectDescription(studentInput: string, sourceMaterial?: string): Promise<any> {
  const prompt = `당신은 중고제 판소리 문화 진흥회의 운영 도우미입니다. 
  공연이나 프로그램에 대한 아이디어를 바탕으로, 플랫폼에 게시할 멋진 제목과 설명을 작성해주세요.
  
  입력: ${studentInput}
  ${sourceMaterial ? `참고 자료: ${sourceMaterial}` : ''}
  
  다음 형식의 JSON으로 응답해주세요:
  - title: 프로그램의 제목
  - description: 프로그램에 대한 상세 설명
  - suggestedType: 추천하는 유형 (Upcoming, Past 중 하나)
  - keyThemes: 주요 키워드 리스트`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: projectDescriptionSchema
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate project description.");
  return JSON.parse(text);
}
