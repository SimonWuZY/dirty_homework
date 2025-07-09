// 剧本类型
export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  characters: Character[];
}

// 角色类型
export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  avatar?: string;
  scriptId: string;
}

// 对话消息类型
export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'user' | 'character' | 'system';
}

// 对话会话类型
export interface Conversation {
  id: string;
  title: string;
  scriptId: string;
  currentCharacter?: Character;
  userCharacter?: Character;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// 后端API标准响应格式
export interface BackendApiResponse<T> {
  code: number;
  status: string;
  message: string;
  data?: T;
}

// 剧本上传/创建响应数据格式
export interface ScriptResponseData {
  script_id: string;
  script_title: string;
  script_content: string;
} 