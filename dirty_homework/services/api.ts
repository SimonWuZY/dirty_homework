import { 
  uploadScriptRsp, 
  analyzeScriptReq, 
  analyzeScriptRsp, 
  modifyRoleReq,
  modifyRoleRsp, 
  getHistoryReq,
  getHistoryRsp,
  ApiResponse,
  startSSEReq,
  startSSERsp
} from './types'

// 剧本相关API
export const scriptApi = {
  // 上传剧本文件 
  upload: async (file: File): Promise<uploadScriptRsp> => {
    try {
      const formData = new FormData();
      const title = file.name.split('.')[0];
      formData.append('title', title);
      formData.append('file', file);

      const response = await fetch(`${process.env.REQUESTAPI}/scripts`, {
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
      
      const response = await fetch(`${process.env.REQUESTAPI}/roles`, {
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
      const response = await fetch(`${process.env.REQUESTAPI}/roles`, {
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
  // 获取历史对话
  getHistory: async (params: getHistoryReq): Promise<getHistoryRsp> => {
    try {
      const response = await fetch(`${process.env.REQUESTAPI}/chat`, {
        method: 'GET',
        body: JSON.stringify(params),
      });
      const result: getHistoryRsp = await response.json();
      return result;
    } catch (error) {
      console.error('获取历史对话失败:', error);
      throw error;
    }
  },

  // 开始 sse 对话
  startSSE: async (params: startSSEReq): Promise<startSSERsp> => {
    try {
      const response = await fetch(`${process.env.REQUESTAPI}/chat`, {
        method: 'POST',
        body: JSON.stringify(params),
      });
      const result: startSSERsp = await response.json();
      return result;
    } catch (error) {
      console.error('开始 sse 对话失败:', error);
      throw error;
    }
  }
}; 