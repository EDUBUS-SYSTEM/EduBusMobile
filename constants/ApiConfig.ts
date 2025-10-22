export const API_CONFIG = {
    ENDPOINTS: {
      USER: {
        PROFILE: '/user/profile',
        UPDATE: '/user/update',
        DELETE: '/user/delete',
      },
      AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
      },
      PARENT: {
        CHILDREN: '/parent/children',
        ADD_CHILD: '/parent/children/add',
        UPDATE_CHILD: '/parent/children/update',
        DELETE_CHILD: '/parent/children/delete',
      },
      DRIVER: {
        ROUTES: '/driver/routes',
        STUDENTS: '/driver/students',
        UPDATE_STATUS: '/driver/status',
        MY_LEAVES: '/driver/my-leaves',
        LEAVES: '/driver/leaves', // + /{id} for get/update/cancel
        SEND_LEAVE_REQUEST: '/Driver/send-leave-request',
      },
      DRIVER_VEHICLE: {
        CURRENT_DRIVER_VEHICLE: '/driverVehicle/current-vehicle',
        CURRENT_VEHICLE_STUDENTS: '/driverVehicle/current-vehicle/students'
      },
      BUS: {
        TRACKING: '/bus/tracking',
        ROUTES: '/bus/routes',
        SCHEDULE: '/bus/schedule',
      },
      TRANSACTION: {
        MY_TRANSACTIONS: '/Transaction/my-transactions',
        DETAIL: '/Transaction', // + /{id}
        BY_STUDENT: '/Transaction/student', // + /{studentId}
      },
      PAYMENT: {
        GENERATE_QR: '/Payment', // + /{transactionId}/qrcode
        CREATE: '/payment/create',
        VERIFY: '/payment/verify',
        HISTORY: '/payment/history',
      },
    },
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
  } as const;