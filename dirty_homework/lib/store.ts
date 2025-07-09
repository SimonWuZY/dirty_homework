import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 剧本类型 - 包含角色信息
export interface Script {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  roles: Role[]  // 每个剧本都有自己的角色列表
}

// 角色类型
export interface Role {
  id: string
  name: string
  character: string
  language_habit: string
}

// 剧本状态
interface ScriptState {
  // 历史剧本列表
  scripts: Script[]
  // 当前选中的剧本
  selectedScript: Script | null
  // 是否正在加载
  loading: boolean
  
  // Actions
  addScript: (script: Script) => void
  updateScript: (id: string, updates: Partial<Script>) => void
  selectScript: (script: Script | null) => void
  setLoading: (loading: boolean) => void
  
  // 角色相关 Actions
  setScriptRoles: (scriptId: string, roles: Role[]) => void
  updateScriptRole: (scriptId: string, roleId: string, updates: Partial<Role>) => void
  getScriptRoles: (scriptId: string) => Role[]
}

export const useScriptStore = create<ScriptState>()(
  persist(
    (set, get) => ({
      scripts: [],
      selectedScript: null,
      loading: false,
      
      addScript: (script) => {
        set((state) => ({
          scripts: [script, ...state.scripts]
        }))
      },
      
      updateScript: (id, updates) => {
        set((state) => ({
          scripts: state.scripts.map(script => 
            script.id === id 
              ? { 
                  ...script, 
                  ...updates, 
                  roles: script.roles || [], // 确保 roles 字段不会被覆盖
                  updatedAt: new Date().toISOString() 
                }
              : script
          ),
          selectedScript: state.selectedScript?.id === id 
            ? { 
                ...state.selectedScript, 
                ...updates, 
                roles: state.selectedScript.roles || [], // 确保 roles 字段不会被覆盖
                updatedAt: new Date().toISOString() 
              }
            : state.selectedScript
        }))
      },
      
      selectScript: (script) => {
        set({ selectedScript: script })
      },
      
      setLoading: (loading) => {
        set({ loading })
      },
      
      // 为指定剧本设置角色列表
      setScriptRoles: (scriptId, roles) => {
        set((state) => ({
          scripts: state.scripts.map(script => 
            script.id === scriptId 
              ? { ...script, roles, updatedAt: new Date().toISOString() }
              : script
          ),
          selectedScript: state.selectedScript?.id === scriptId 
            ? { ...state.selectedScript, roles, updatedAt: new Date().toISOString() }
            : state.selectedScript
        }))
      },
      
      // 更新指定剧本的指定角色
      updateScriptRole: (scriptId, roleId, updates) => {
        set((state) => ({
          scripts: state.scripts.map(script => 
            script.id === scriptId 
              ? {
                  ...script,
                  roles: (script.roles || []).map(role => 
                    role.id === roleId 
                      ? { ...role, ...updates }
                      : role
                  ),
                  updatedAt: new Date().toISOString()
                }
              : script
          ),
          selectedScript: state.selectedScript?.id === scriptId 
            ? {
                ...state.selectedScript,
                roles: (state.selectedScript.roles || []).map(role => 
                  role.id === roleId 
                    ? { ...role, ...updates }
                    : role
                ),
                updatedAt: new Date().toISOString()
              }
            : state.selectedScript
        }))
      },
      
      // 获取指定剧本的角色列表
      getScriptRoles: (scriptId) => {
        const state = get()
        const script = state.scripts.find(s => s.id === scriptId)
        return script?.roles || []
      }
    }),
    {
      name: 'script-storage',
      partialize: (state) => ({ 
        scripts: state.scripts,
        selectedScript: state.selectedScript 
      })
    }
  )
) 