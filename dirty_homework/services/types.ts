export const requestAPI = 'http://47.120.11.159:31721/api/v1';

// 剧本角色
interface roles {
    id: string;
    name: string;
    character: string;
    language_habit: string;
}

// 上传剧本请求
export interface uploadScriptReq {
    title: string;
    file: File;
}

// 上传剧本响应
export interface uploadScriptRsp {
    code: number;
    status: string;
    message: string;
    data: {
        script_id: string;
        script_title: string;
        script_content: string;
    }
}

// 分析剧本请求
export interface analyzeScriptReq {
    script_id: string;
}

// 分析剧本响应
export interface analyzeScriptRsp {
    code: number;
    status: string;
    message: string;
    data: {
        roles: roles[];
    }
}

// 查询剧本角色信息请求
export interface queryRolesReq {
    script_id: string;
}

// 查询剧本角色信息响应
export interface queryRolesRsp {
    code: number;
    status: string;
    message: string;
    data: {
        roles: roles[];
    }
}

// 修改角色请求
export interface modifyRoleReq {
    id: string;
    name: string;
    character: string;
    language_habit: string;
}

// 修改角色响应
export interface modifyRoleRsp {
    code: number;
    status: string;
    message: string;
}


// 获取历史对话请求
export interface getHistoryReq {
    role_id_user: string;
    role_id_assistant: string;
}

interface historyItem {
    role: string;
    content: string;
}

// 获取历史对话响应
export interface getHistoryRsp {
    code: number;
    status: string;
    message: string;
    data: {
        role_id_user: string;
        role_id_assistant: string;
        history: historyItem[];
    }
}


// 对话接口