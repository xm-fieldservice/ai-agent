/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { Button as VanButton } from 'vant';
import { databaseService, DatabaseStatus } from '../services/database-service';
import { userService } from '../services/user-service';
import { UserRole, UserStatus } from '../models/User';
// 状态变量
const connecting = ref(false);
const initializing = ref(false);
const initialized = ref(false);
const initError = ref(null);
const creatingUser = ref(false);
const fetchingUsers = ref(false);
const testUser = ref(null);
const users = ref([]);
// 获取数据库状态
const dbStatus = databaseService.getStatus();
// 计算属性
const statusText = computed(() => {
    switch (dbStatus.status.value) {
        case DatabaseStatus.CONNECTED:
            return '已连接';
        case DatabaseStatus.CONNECTING:
            return '连接中...';
        case DatabaseStatus.DISCONNECTED:
            return '未连接';
        case DatabaseStatus.ERROR:
            return '连接错误';
        default:
            return '未知状态';
    }
});
const statusClass = computed(() => {
    switch (dbStatus.status.value) {
        case DatabaseStatus.CONNECTED:
            return 'status-connected';
        case DatabaseStatus.CONNECTING:
            return 'status-connecting';
        case DatabaseStatus.DISCONNECTED:
            return 'status-disconnected';
        case DatabaseStatus.ERROR:
            return 'status-error';
        default:
            return '';
    }
});
const errorMessage = computed(() => dbStatus.error.value);
const isConnected = computed(() => dbStatus.status.value === DatabaseStatus.CONNECTED);
// 方法
const connectDatabase = async () => {
    if (isConnected.value)
        return;
    connecting.value = true;
    try {
        await databaseService.connect();
    }
    catch (error) {
        console.error('连接数据库失败:', error);
    }
    finally {
        connecting.value = false;
    }
};
const disconnectDatabase = async () => {
    try {
        await databaseService.disconnect();
        initialized.value = false;
        initError.value = null;
        testUser.value = null;
        users.value = [];
    }
    catch (error) {
        console.error('断开数据库连接失败:', error);
    }
};
const initDatabase = async () => {
    initializing.value = true;
    initError.value = null;
    try {
        // 创建用户表
        const createTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        avatar VARCHAR(255),
        role ENUM('user', 'admin', 'guest') NOT NULL DEFAULT 'user',
        status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
        last_login DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
        await databaseService.query(createTableSql);
        console.log('用户表创建/验证成功');
        initialized.value = true;
    }
    catch (error) {
        console.error('初始化数据库失败:', error);
        initError.value = error instanceof Error ? error.message : '初始化数据库失败';
    }
    finally {
        initializing.value = false;
    }
};
const createTestUser = async () => {
    if (creatingUser.value)
        return;
    creatingUser.value = true;
    try {
        // 生成随机用户名以避免冲突
        const randomSuffix = Math.floor(Math.random() * 10000);
        const username = `test_user_${randomSuffix}`;
        const newUser = await userService.register({
            username,
            email: `${username}@example.com`,
            password: 'password123',
            displayName: `测试用户 ${randomSuffix}`,
            role: UserRole.USER,
            status: UserStatus.ACTIVE
        });
        if (newUser) {
            testUser.value = newUser;
            await fetchUsers(); // 刷新用户列表
        }
    }
    catch (error) {
        console.error('创建测试用户失败:', error);
    }
    finally {
        creatingUser.value = false;
    }
};
const fetchUsers = async () => {
    if (fetchingUsers.value)
        return;
    fetchingUsers.value = true;
    try {
        users.value = await userService.getUsers(10, 0);
    }
    catch (error) {
        console.error('获取用户列表失败:', error);
    }
    finally {
        fetchingUsers.value = false;
    }
};
// 组件挂载时自动尝试连接
onMounted(async () => {
    // 只在开发模式下自动连接
    if (import.meta.env.DEV) {
        await connectDatabase();
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['user-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "database-test-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: (['status-value', __VLS_ctx.statusClass]) },
});
(__VLS_ctx.statusText);
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-message" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "button-group" },
});
const __VLS_0 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.connecting),
    disabled: (__VLS_ctx.isConnected),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.connecting),
    disabled: (__VLS_ctx.isConnected),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.connectDatabase)
};
__VLS_3.slots.default;
(__VLS_ctx.isConnected ? '已连接' : '连接数据库');
var __VLS_3;
const __VLS_8 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    type: "danger",
    disabled: (!__VLS_ctx.isConnected),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    type: "danger",
    disabled: (!__VLS_ctx.isConnected),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.disconnectDatabase)
};
__VLS_11.slots.default;
var __VLS_11;
if (__VLS_ctx.isConnected) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "init-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    const __VLS_16 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.initializing),
        disabled: (__VLS_ctx.initialized),
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.initializing),
        disabled: (__VLS_ctx.initialized),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (__VLS_ctx.initDatabase)
    };
    __VLS_19.slots.default;
    (__VLS_ctx.initialized ? '已初始化' : '初始化数据库');
    var __VLS_19;
    if (__VLS_ctx.initError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "error-message" },
        });
        (__VLS_ctx.initError);
    }
    if (__VLS_ctx.initialized) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "success-message" },
        });
    }
}
if (__VLS_ctx.initialized) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "test-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "test-action" },
    });
    const __VLS_24 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.creatingUser),
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.creatingUser),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        onClick: (__VLS_ctx.createTestUser)
    };
    __VLS_27.slots.default;
    var __VLS_27;
    if (__VLS_ctx.testUser) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "success-message" },
        });
        (__VLS_ctx.testUser.username);
        (__VLS_ctx.testUser.id);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "test-action" },
    });
    const __VLS_32 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        ...{ 'onClick': {} },
        type: "info",
        loading: (__VLS_ctx.fetchingUsers),
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onClick': {} },
        type: "info",
        loading: (__VLS_ctx.fetchingUsers),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_36;
    let __VLS_37;
    let __VLS_38;
    const __VLS_39 = {
        onClick: (__VLS_ctx.fetchUsers)
    };
    __VLS_35.slots.default;
    var __VLS_35;
    if (__VLS_ctx.users.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "result-container" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        (__VLS_ctx.users.length);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "user-list" },
        });
        for (const [user] of __VLS_getVForSourceType((__VLS_ctx.users))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (user.id),
                ...{ class: "user-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "user-name" },
            });
            (user.username);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "user-email" },
            });
            (user.email);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "user-role" },
            });
            (user.role);
        }
    }
}
/** @type {__VLS_StyleScopedClasses['database-test-container']} */ ;
/** @type {__VLS_StyleScopedClasses['status-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['status-item']} */ ;
/** @type {__VLS_StyleScopedClasses['status-label']} */ ;
/** @type {__VLS_StyleScopedClasses['status-value']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['button-group']} */ ;
/** @type {__VLS_StyleScopedClasses['init-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['test-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['test-action']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['test-action']} */ ;
/** @type {__VLS_StyleScopedClasses['result-container']} */ ;
/** @type {__VLS_StyleScopedClasses['user-list']} */ ;
/** @type {__VLS_StyleScopedClasses['user-item']} */ ;
/** @type {__VLS_StyleScopedClasses['user-name']} */ ;
/** @type {__VLS_StyleScopedClasses['user-email']} */ ;
/** @type {__VLS_StyleScopedClasses['user-role']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanButton: VanButton,
            connecting: connecting,
            initializing: initializing,
            initialized: initialized,
            initError: initError,
            creatingUser: creatingUser,
            fetchingUsers: fetchingUsers,
            testUser: testUser,
            users: users,
            statusText: statusText,
            statusClass: statusClass,
            errorMessage: errorMessage,
            isConnected: isConnected,
            connectDatabase: connectDatabase,
            disconnectDatabase: disconnectDatabase,
            initDatabase: initDatabase,
            createTestUser: createTestUser,
            fetchUsers: fetchUsers,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
