import { Script, Character, Conversation, Message, ApiResponse } from '../types';

const API_BASE_URL = '/api';

// 通用API请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误',
    };
  }
}

// 剧本相关API
export const scriptApi = {
  // 获取所有剧本
  getAll: () => apiRequest<Script[]>('/scripts'),
  
  // 获取单个剧本
  getById: (id: string) => apiRequest<Script>(`/scripts/${id}`),
  
  // 创建剧本
  create: (script: Partial<Script>) => 
    apiRequest<Script>('/scripts', {
      method: 'POST',
      body: JSON.stringify(script),
    }),
  
  // 更新剧本
  update: (id: string, script: Partial<Script>) =>
    apiRequest<Script>(`/scripts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(script),
    }),
  
  // 删除剧本
  delete: (id: string) =>
    apiRequest<void>(`/scripts/${id}`, {
      method: 'DELETE',
    }),
  
  // 上传剧本文件
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch(`${API_BASE_URL}/scripts/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
  
  // 解析剧本生成角色
  parse: (id: string) =>
    apiRequest<Character[]>(`/scripts/${id}/parse`, {
      method: 'POST',
    }),
};

// 角色相关API
export const characterApi = {
  // 获取剧本的所有角色
  getByScriptId: (scriptId: string) =>
    apiRequest<Character[]>(`/characters?scriptId=${scriptId}`),
  
  // 更新角色信息
  update: (id: string, character: Partial<Character>) =>
    apiRequest<Character>(`/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(character),
    }),
};

// 对话相关API
export const conversationApi = {
  // 获取所有对话
  getAll: () => apiRequest<Conversation[]>('/conversations'),
  
  // 获取单个对话
  getById: (id: string) => apiRequest<Conversation>(`/conversations/${id}`),
  
  // 创建新对话
  create: (conversation: Partial<Conversation>) =>
    apiRequest<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(conversation),
    }),
  
  // 发送消息
  sendMessage: (conversationId: string, message: Partial<Message>) =>
    apiRequest<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    }),
  
  // 获取对话消息
  getMessages: (conversationId: string) =>
    apiRequest<Message[]>(`/conversations/${conversationId}/messages`),
}; 