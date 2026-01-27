// pages/RegistrationManagement.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import Pagination from '../components/Pagination';
import { Input, Select, Spin, message, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getAllRegistrations, updateRegistrationStatus, Registration, autoAssignRooms } from '../api';
import { getActiveSemester } from '../api_handlers/semesterApi';
import API_BASE_URL from '../api_handlers/config';

// Get backend base URL for file access (remove /api suffix)
const BACKEND_URL = API_BASE_URL.replace('/api', '');

const RegistrationManagement: React.FC = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for approval/rejection
    const [showModal, setShowModal] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
    const [modalAction, setModalAction] = useState<'APPROVED' | 'REJECTED' | 'RETURN'>('APPROVED');
    const [adminNote, setAdminNote] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailRegistration, setDetailRegistration] = useState<Registration | null>(null);

    const isManager = user?.role === 'MANAGER' || user?.role === 'manager';
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

    useEffect(() => {
        fetchRegistrations();
    }, [page, statusFilter, typeFilter, searchQuery]);

    const fetchRegistrations = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters: { status?: string; search?: string; registration_type?: string } = {};
            if (statusFilter) filters.status = statusFilter;
            if (typeFilter) filters.registration_type = typeFilter;
            if (searchQuery) filters.search = searchQuery;

            const response = await getAllRegistrations(page, 20, filters);
            setRegistrations(response.data);
            setTotalPages(response.meta.totalPages);
            setTotal(response.meta.total);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách đơn đăng ký');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (registration: Registration, action: 'APPROVED' | 'REJECTED' | 'RETURN') => {
        setSelectedRegistration(registration);
        setModalAction(action);
        setAdminNote('');
        setShowModal(true);
    };

    const handleOpenDetailModal = (registration: Registration) => {
        setDetailRegistration(registration);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setDetailRegistration(null);
    };

    const getPriorityCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'NONE': 'Không có',
            'POOR_HOUSEHOLD': 'Hộ nghèo / Cận nghèo',
            'DISABILITY': 'Sinh viên khuyết tật',
            'OTHER': 'Diện ưu tiên khác',
        };
        return labels[category] || category;
    };

    const getEvidenceUrl = (path: string) => {
        // Path is stored as 'uploads/evidence/filename.ext'
        return `${BACKEND_URL}/${path}`;
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRegistration(null);
        setAdminNote('');
    };

    const handleConfirmAction = async () => {
        if (!selectedRegistration) return;

        setProcessingAction(true);
        try {
            await updateRegistrationStatus(selectedRegistration.id, modalAction, adminNote);
            handleCloseModal();
            fetchRegistrations(); // Refresh the list
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingAction(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ duyệt' },
            'RETURN': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Yêu cầu bổ sung' },
            'AWAITING_PAYMENT': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Chờ thanh toán' },
            'APPROVED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' },
            'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Hoàn thành' },
            'REJECTED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối' },
            'CANCELLED': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' },
        };
        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
            'NORMAL': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Thường' },
            'PRIORITY': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Ưu tiên' },
            'RENEWAL': { bg: 'bg-green-50', text: 'text-green-700', label: 'Gia hạn' },
        };
        const config = typeConfig[type] || { bg: 'bg-gray-50', text: 'text-gray-700', label: type };
        return (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const basePath = isAdmin ? '/admin' : '/manager';

    return (
        <RoleBasedLayout
            searchPlaceholder="Tìm đơn đăng ký..."
            headerTitle="Quản lý đơn đăng ký"
            headerSubtitle={`Tổng: ${total} đơn`}
        >
            <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">Danh sách Đơn Đăng ký Ở</h1>
                        <p className="text-text-secondary dark:text-gray-400 text-sm mt-2">Quản lý và xử lý các đơn đăng ký nội trú của sinh viên.</p>
                    </div>
                </div>

                {/* Filters */}
                <div>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-12 lg:col-span-6">
                                <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Tìm kiếm</label>
                                <Input
                                    placeholder="Nhập tên hoặc MSSV..."
                                    prefix={<SearchOutlined />}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-11 gap-3 pl-1"
                                />
                            </div>
                            <div className="md:col-span-6 lg:col-span-3">
                                <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Trạng thái</label>
                                <Select
                                    placeholder="Tất cả trạng thái"
                                    value={statusFilter || undefined}
                                    onChange={(value) => {
                                        setStatusFilter(value);
                                        setPage(1);
                                    }}
                                    className="w-full h-11"
                                    options={[
                                        { label: 'Tất cả trạng thái', value: '' },
                                        { label: 'Chờ duyệt', value: 'PENDING' },
                                        { label: 'Yêu cầu bổ sung', value: 'RETURN' },
                                        { label: 'Đã duyệt', value: 'APPROVED' },
                                        { label: 'Từ chối', value: 'REJECTED' },
                                        { label: 'Chờ thanh toán', value: 'AWAITING_PAYMENT' },
                                        { label: 'Hoàn thành', value: 'COMPLETED' },
                                    ]}
                                />
                            </div>
                            <div className="md:col-span-6 lg:col-span-3">
                                <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Loại đăng ký</label>
                                <Select
                                    placeholder="Tất cả loại"
                                    value={typeFilter || undefined}
                                    onChange={(value) => {
                                        setTypeFilter(value);
                                        setPage(1);
                                    }}
                                    className="w-full h-11"
                                    options={[
                                        { label: 'Tất cả loại', value: '' },
                                        { label: 'Thường', value: 'NORMAL' },
                                        { label: 'Ưu tiên', value: 'PRIORITY' },
                                        { label: 'Gia hạn', value: 'RENEWAL' },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Table Section */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Spin size="large" tip="Đang tải dữ liệu..." />
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 inline-block">inbox</span>
                                <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">Không có đơn đăng ký nào</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-color dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">ID</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Sinh viên</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Loại</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Tòa nhà</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Trạng thái</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Ngày tạo</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-color dark:divide-gray-700">
                                        {registrations.map((reg) => (
                                            <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main dark:text-white">#{reg.id}</td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-text-main dark:text-white">{reg.student_name || 'N/A'}</p>
                                                        <p className="text-xs text-text-secondary dark:text-gray-400">{reg.mssv || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{getTypeBadge(reg.registration_type)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-300">{reg.building_name || 'Chưa chọn'}</td>
                                                <td className="px-6 py-4">{getStatusBadge(reg.status)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-300">{formatDate(reg.created_at)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {/* View Detail Button - Always visible */}
                                                        <button
                                                            onClick={() => handleOpenDetailModal(reg)}
                                                            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                            title="Xem chi tiết"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                                        </button>
                                                        {reg.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenModal(reg, 'APPROVED')}
                                                                    className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                                    title="Duyệt"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenModal(reg, 'RETURN')}
                                                                    className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                                                                    title="Yêu cầu bổ sung"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">undo</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenModal(reg, 'REJECTED')}
                                                                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                                    title="Từ chối"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                totalItems={total}
                                itemsPerPage={20}
                                onPageChange={setPage}
                                itemsPerPageOptions={[10, 20, 50]}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Modal for Approve/Reject */}
            {showModal && selectedRegistration && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {modalAction === 'APPROVED' && 'Duyệt đơn đăng ký'}
                            {modalAction === 'REJECTED' && 'Từ chối đơn đăng ký'}
                            {modalAction === 'RETURN' && 'Yêu cầu bổ sung thông tin'}
                        </h3>

                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                <strong>Sinh viên:</strong> {selectedRegistration.student_name} ({selectedRegistration.mssv})
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                <strong>Loại đăng ký:</strong> {selectedRegistration.registration_type}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ghi chú (tùy chọn)
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Nhập lý do hoặc ghi chú..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                disabled={processingAction}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                disabled={processingAction}
                                className={`flex-1 px-4 py-2 rounded-xl text-white transition-colors disabled:opacity-50
                                    ${modalAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' :
                                        modalAction === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                                            'bg-orange-600 hover:bg-orange-700'}`}
                            >
                                {processingAction ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && detailRegistration && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">assignment</span>
                                Chi tiết đơn đăng ký #{detailRegistration.id}
                            </h3>
                            <button
                                onClick={handleCloseDetailModal}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    Thông tin sinh viên
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Họ và tên</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{detailRegistration.student_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">MSSV</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{detailRegistration.mssv || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Registration Details */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">description</span>
                                    Thông tin đăng ký
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Loại đăng ký</p>
                                        <div className="mt-1">{getTypeBadge(detailRegistration.registration_type)}</div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Trạng thái</p>
                                        <div className="mt-1">{getStatusBadge(detailRegistration.status)}</div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tòa nhà mong muốn</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{detailRegistration.building_name || 'Chưa chọn'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Ngày tạo</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(detailRegistration.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Priority Info - Only for PRIORITY registrations */}
                            {detailRegistration.registration_type === 'PRIORITY' && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">star</span>
                                        Thông tin ưu tiên
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-purple-600 dark:text-purple-400">Diện ưu tiên</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {getPriorityCategoryLabel(detailRegistration.priority_category)}
                                            </p>
                                        </div>
                                        {detailRegistration.priority_description && (
                                            <div>
                                                <p className="text-xs text-purple-600 dark:text-purple-400">Mô tả</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {detailRegistration.priority_description}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Evidence File Section */}
                            {detailRegistration.evidence_file_path && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">attach_file</span>
                                        Minh chứng đính kèm
                                    </h4>
                                    <div className="space-y-3">
                                        {/* Check if it's an image or PDF */}
                                        {detailRegistration.evidence_file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <div className="rounded-lg overflow-hidden border border-blue-200 dark:border-blue-700">
                                                <img
                                                    src={getEvidenceUrl(detailRegistration.evidence_file_path)}
                                                    alt="Minh chứng"
                                                    className="w-full max-h-[400px] object-contain bg-white"
                                                />
                                            </div>
                                        ) : detailRegistration.evidence_file_path.match(/\.pdf$/i) ? (
                                            <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                                                <span className="material-symbols-outlined text-5xl text-red-500">picture_as_pdf</span>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">Tệp PDF đính kèm</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                                                <span className="material-symbols-outlined text-5xl text-gray-400">description</span>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">Tệp đính kèm</p>
                                            </div>
                                        )}

                                        <a
                                            href={getEvidenceUrl(detailRegistration.evidence_file_path)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            Mở file trong tab mới
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Admin Note */}
                            {detailRegistration.admin_note && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                                    <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">note</span>
                                        Ghi chú của quản lý
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{detailRegistration.admin_note}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3">
                            <button
                                onClick={handleCloseDetailModal}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Đóng
                            </button>
                            {detailRegistration.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => {
                                            handleCloseDetailModal();
                                            handleOpenModal(detailRegistration, 'APPROVED');
                                        }}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                                    >
                                        Duyệt đơn
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleCloseDetailModal();
                                            handleOpenModal(detailRegistration, 'REJECTED');
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                                    >
                                        Từ chối
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-assign Result Modal */}
            {showAutoAssignModal && autoAssignResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                            <h2 className="text-2xl font-bold">Kết quả phân phòng tự động</h2>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {autoAssignResult.result.total}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tổng số đơn</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {autoAssignResult.result.success}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Thành công</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                        {autoAssignResult.result.failed}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Thất bại</div>
                                </div>
                            </div>

                            {/* Details */}
                            {autoAssignResult.result.details && autoAssignResult.result.details.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Chi tiết phân phòng</h3>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {autoAssignResult.result.details.map((detail: any, index: number) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-lg border ${
                                                    detail.status === 'SUCCESS'
                                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">
                                                            {detail.student_name} ({detail.mssv})
                                                        </div>
                                                        {detail.status === 'SUCCESS' ? (
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                Phòng: {detail.assigned_room}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-red-600 dark:text-red-400">
                                                                {detail.reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`material-symbols-outlined ${
                                                        detail.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {detail.status === 'SUCCESS' ? 'check_circle' : 'cancel'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end rounded-b-2xl">
                            <button
                                onClick={() => {
                                    setShowAutoAssignModal(false);
                                    setAutoAssignResult(null);
                                }}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </RoleBasedLayout>
    );
};

export default RegistrationManagement;
