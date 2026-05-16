import React from 'react';
import { useToast } from './useReactQuery';

export const useApiError = () => {
  const { showToast } = useToast();

  const handleError = (error, fallbackMessage = 'Đã xảy ra lỗi') => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          showToast(data?.message || 'Yêu cầu không hợp lệ', 'error');
          break;
        case 401:
          showToast('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'warning');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => (window.location.href = '/login'), 1500);
          break;
        case 403:
          showToast('Bạn không có quyền thực hiện thao tác này.', 'error');
          break;
        case 404:
          showToast(data?.message || 'Không tìm thấy tài nguyên.', 'info');
          break;
        case 409:
          showToast(data?.message || 'Tài nguyên đã tồn tại.', 'warning');
          break;
        case 422:
          showToast(data?.message || 'Dữ liệu không hợp lệ.', 'error');
          break;
        case 429:
          showToast('Quá nhiều yêu cầu. Vui lòng thử lại sau.', 'warning');
          break;
        case 500:
          showToast('Lỗi server. Vui lòng thử lại sau.', 'error');
          break;
        default:
          showToast(data?.message || fallbackMessage, 'error');
      }
    } else if (error.request) {
      showToast('Không thể kết nối server. Kiểm tra kết nối internet.', 'error');
    } else {
      showToast(fallbackMessage, 'error');
    }
    return error;
  };

  return { handleError };
};

// Global Error Boundary for React
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-gray-600 mb-4">
              Rất tiếc, đã có lỗi xảy ra. Vui lòng tải lại trang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
