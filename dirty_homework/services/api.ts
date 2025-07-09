import { Script, Character, Conversation, Message, ApiResponse, BackendApiResponse, ScriptResponseData } from '../types'
import { 
  requestAPI, 
  uploadScriptReq, 
  uploadScriptRsp, 
  analyzeScriptReq, 
  analyzeScriptRsp, 
  queryRolesReq, 
  queryRolesRsp,
  modifyRoleReq,
  modifyRoleRsp 
} from './types'
import { Script as StoreScript, Role } from '../lib/store';

// 通用API请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${requestAPI}${endpoint}`, {
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
  // 上传剧本文件 
  upload: async (file: File): Promise<uploadScriptRsp> => {
    try {
      const formData = new FormData();
      const title = file.name.split('.')[0];
      formData.append('title', title);
      formData.append('file', file);
      
      const response = await fetch(`${requestAPI}/scripts`, {
        method: 'POST',
        body: formData,
      });
      
      const result: uploadScriptRsp = await response.json();
      return result;
    } catch (error) {
      return {
        code: -1,
        status: 'error',
        message: error instanceof Error ? error.message : '网络错误',
        data: {
          script_id: '',
          script_title: '',
          script_content: ''
        }
      };
    }
  },

  // 分析剧本生成角色
  analyze: async (scriptId: string): Promise<analyzeScriptRsp> => {
    try {
      const requestBody: analyzeScriptReq = {
        script_id: scriptId
      };
      
      const response = await fetch(`${requestAPI}/roles`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result: analyzeScriptRsp = await response.json();
      return result;
    } catch (error) {
      return {
        code: -1,
        status: 'error',
        message: error instanceof Error ? error.message : '网络错误',
        data: {
          roles: []
        }
      };
    }
  },

  // 修改角色
  modifyRole: async (params: modifyRoleReq): Promise<modifyRoleRsp> => {
    try {
      const response = await fetch(`${requestAPI}/roles`, {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      
      const result: modifyRoleRsp = await response.json();
      return result;
    } catch (error) {
      console.error('修改角色失败:', error);
      return {
        code: -1,
        status: 'error',
        message: '修改角色失败'
      };
    }
  },
};

// 角色相关API - 已移除，现在使用 store 中的角色信息

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