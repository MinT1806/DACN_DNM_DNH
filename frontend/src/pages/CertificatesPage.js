import { useState, useEffect } from 'react';
import { certificateAPI } from '../api/api';
import { Skeleton } from '../hooks/useReactQuery';
import { Link } from 'react-router-dom';

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const res = await certificateAPI.getMy();
      setCertificates(res.data || []);
    } catch (err) {
      console.error('Error loading certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Chứng chỉ của tôi</h1>
        <p className="text-gray-600 mt-1">Các chứng chỉ bạn đã đạt được</p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-8xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-2">Chưa có chứng chỉ nào</h2>
          <p className="text-gray-600 mb-6">
            Hoàn thành các khóa học để nhận chứng chỉ!
          </p>
          <Link
            to="/courses"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
          >
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg overflow-hidden border-2 border-blue-200"
            >
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white text-center">
                <div className="text-4xl mb-2">🎓</div>
                <h3 className="text-lg font-medium opacity-90">ABC English Certificate</h3>
                <p className="text-sm opacity-75">Chứng chỉ hoàn thành khóa học</p>
              </div>

              {/* Certificate Body */}
              <div className="p-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">Học viên</p>
                  <p className="text-xl font-bold text-gray-800">{cert.userName}</p>
                </div>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">Khóa học</p>
                  <p className="text-lg font-medium text-blue-700">{cert.courseName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-500">Trình độ</p>
                    <p className="text-lg font-bold text-gray-800">{cert.level}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-500">Điểm số</p>
                    <p className="text-lg font-bold text-green-600">{cert.finalScore}%</p>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 mb-4">
                  <p>Ngày hoàn thành: {cert.completionDate}</p>
                  <p className="mt-1">Số: {cert.certificateNumber}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => certificateAPI.download(cert.courseId)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Tải PDF
                  </button>
                  <Link
                    to={`/courses/${cert.courseId}`}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    Xem khóa học
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
