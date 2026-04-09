import React, { useState, useEffect, useContext } from 'react';
import Axios from '../../Api/Axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { UserContext } from '../../Context/UserContext';
import { Table, Input, Select, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

// ── Mock data shown when no event is selected or data is empty ────────────────
const MOCK_STATUS = [
  { name: 'Completed', value: 42, fill: '#10b981' },
  { name: 'Pending',   value: 31, fill: '#f59e0b' },
  { name: 'Scheduled', value: 18, fill: '#3b82f6' },
];
const MOCK_COMPANIES = [
  { company: 'TechCorp', slotCount: 12 },
  { company: 'Innovate Ltd', slotCount: 9 },
  { company: 'GlobalSys', slotCount: 7 },
  { company: 'DataPeak', slotCount: 5 },
  { company: 'CloudBase', slotCount: 3 },
];
const MOCK_STATS = { totalUsers: 91, giftsCollected: 24, totalEvents: 3 };
const MOCK_TABLE = [
  { _id: 'm1', firstName: 'Priya', lastName: 'Sharma', email: 'priya@techcorp.com', slots: { company: 'TechCorp', timeSlot: '10:00', completed: true } },
  { _id: 'm2', firstName: 'Rahul', lastName: 'Mehta', email: 'rahul@innovate.com', slots: { company: 'Innovate Ltd', timeSlot: '10:30', completed: false } },
  { _id: 'm3', firstName: 'Anita', lastName: 'Verma', email: 'anita@globalsys.com', slots: { company: 'GlobalSys', timeSlot: '11:00', completed: true } },
  { _id: 'm4', firstName: 'Suresh', lastName: 'Nair', email: 'suresh@datapeak.com', slots: { company: 'DataPeak', timeSlot: '11:30', completed: false } },
  { _id: 'm5', firstName: 'Kavya', lastName: 'Iyer', email: 'kavya@cloudbase.com', slots: { company: 'CloudBase', timeSlot: '12:00', completed: false } },
];


const DashboardStats = () => {
  const [dashboardData, setDashboardData] = useState({
    statistics: {
      statusDistribution: {}, 
      registrationTrends: [],
      topSelectors: [],
      totalUsers: 0,
      totalEvents: 0,
      giftsCollected: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const { user } = useContext(UserContext);
  
  // Users table states
  const [usersData, setUsersData] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    company: '',
    slot: '',
    status: '',
    sortBy: 'desc',
  });
  const [companyOptions, setCompanyOptions] = useState([]);
  const [slotOptions, setSlotOptions] = useState([]);
  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
  ];
  
  // Modified state for single select
  const [eventOptions, setEventOptions] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventsLoading, setEventsLoading] = useState(false);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    fetchEventOptions();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, selectedEvent]);

  useEffect(() => {
    if (selectedEvent) {
      fetchUsersData();
      fetchFilterOptions();
    }
  }, [timeRange, selectedEvent, filters, pagination.current]);

  const fetchEventOptions = async () => {
    try {
      setEventsLoading(true);
      const response = await Axios.get('/events/event-list');
      if (response.data.success) {
        const options = response.data.data.map(event => ({
          value: event.id,
          label: event.title
        }));
        setEventOptions(options);
        // Only auto-select first event if none is selected and list is not empty
        if (!selectedEvent && options.length > 0) {
          setSelectedEvent(options[0].value);
        }
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if((user.role !== "admin") && (!selectedEvent)){
        return;
      }
      
      // Build params object
      const params = {};
      
      // Add time range if not 'all'
      if (timeRange !== 'all') {
        params.timeRange = timeRange;
      }
      
      // Add event ID if selected
      if (selectedEvent) {
        params.eventId = selectedEvent;
      }
      
      const response = await Axios.get('/dashboard', { params });
      setDashboardData(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (e) => {
    setSelectedEvent(e.target.value);
    setPagination({ ...pagination, current: 1 });
    setFilters({
      company: '',
      slot: '',
      status: '',
      sortBy: 'desc',
    });
  };

  const fetchFilterOptions = async () => {
    if (!selectedEvent) return;
    
    try {
      // Fetch unique companies
      const companiesRes = await Axios.get(`/dashboard/companies/${selectedEvent}`);
      if (companiesRes.data.success) {
        setCompanyOptions(companiesRes.data.data.map(company => ({
          value: company,
          label: company
        })));
      }
      
      // Fetch unique time slots
      const slotsRes = await Axios.get(`/dashboard/slots/${selectedEvent}`);
      if (slotsRes.data.success) {
        setSlotOptions(slotsRes.data.data.map(slot => ({
          value: slot,
          label: slot
        })));
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchUsersData = async () => {
    if (!selectedEvent) {
      console.log('No event selected, skipping fetch');
      return;
    }
    
    try {
      console.log('Fetching users with filters:', { 
        eventId: selectedEvent, 
        ...filters, 
        page: pagination.current, 
        limit: pagination.pageSize 
      });
      
      setUsersLoading(true);
      const response = await Axios.post(`/dashboard/users-slot/${selectedEvent}`, {
        ...filters,
        page: pagination.current,
        limit: pagination.pageSize,
      });
      
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        console.log('Setting users data:', response.data.users);
        setUsersData(response.data.users || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
      setUsersData([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
      }));
    } finally {
      setUsersLoading(false);
    }
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
    setPagination({ ...pagination, current: 1 });
  };

  const handleResetFilters = () => {
    setFilters({
      company: '',
      slot: '',
      status: '',
      sortBy: 'desc',
    });
    setPagination({ ...pagination, current: 1 });
  };


  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName || ''} ${record.lastName || ''}`.trim(),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Company',
      key: 'company',
      render: (_, record) => record.slots?.company || '-',
    },
    {
      title: 'Time Slot',
      key: 'timeSlot',
      render: (_, record) => record.slots?.timeSlot || '-',
    },
    {
      title: 'Status',
      key: 'status',
      sorter: true,
      render: (_, record) => {
        const isCompleted = record.slots?.completed;
        const statusText = isCompleted ? 'completed' : 'pending';
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            isCompleted 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
          </span>
        );
      },
    },
    {
      title: 'Registration Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  const { statistics } = dashboardData || {};
  const isMock = !selectedEvent || !statistics?.totalUsers;

  const displayStats = isMock ? MOCK_STATS : {
    totalUsers: statistics?.totalUsers || 0,
    giftsCollected: statistics?.giftsCollected || 0,
    totalEvents: statistics?.totalEvents || 0,
  };

  const statusChartData = isMock
    ? MOCK_STATUS
    : Object.entries(statistics?.statusDistribution || {}).map(([status, count], i) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        fill: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'][i % 4],
      }));

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          {isMock && <p className="text-xs text-amber-600 mt-0.5">Showing sample data — select an event to see real stats</p>}
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
          <select
            value={selectedEvent}
            onChange={handleEventChange}
            disabled={eventsLoading}
            className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white min-w-[180px] disabled:bg-slate-50"
          >
            <option value="">All Events</option>
            {eventOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Attendees', value: displayStats.totalUsers, color: 'bg-blue-50 text-blue-700' },
          { label: 'Gifts Collected', value: displayStats.giftsCollected, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Events', value: displayStats.totalEvents, color: 'bg-amber-50 text-amber-700' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color.split(' ')[1]}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts + table row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Users table */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Attendee Slots</h3>
            <Button icon={<ReloadOutlined />} onClick={fetchUsersData} loading={usersLoading} size="small">Refresh</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={filters.search || ''}
              onChange={e => handleFilterChange('search', e.target.value)}
              allowClear size="small"
            />
            <Select placeholder="Company" className="w-full" value={filters.company || undefined} onChange={v => handleFilterChange('company', v)} options={companyOptions} allowClear size="small" />
            <Select placeholder="Status" className="w-full" value={filters.status || undefined} onChange={v => handleFilterChange('status', v)} options={[{ value: 'scheduled', label: 'Scheduled' }, { value: 'completed', label: 'Completed' }]} allowClear size="small" />
            <Select placeholder="Time Slot" className="w-full" value={filters.slot || undefined} onChange={v => handleFilterChange('slot', v)} options={slotOptions} allowClear size="small" />
          </div>
          <Table
            columns={[
              { title: 'Name', key: 'name', render: (_, r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() },
              { title: 'Company', key: 'company', render: (_, r) => r.slots?.company || '—' },
              { title: 'Slot', key: 'slot', render: (_, r) => r.slots?.timeSlot || '—' },
              { title: 'Status', key: 'status', render: (_, r) => {
                const done = r.slots?.completed;
                return <span className={`px-2 py-0.5 rounded text-xs font-medium ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{done ? 'Completed' : 'Pending'}</span>;
              }},
            ]}
            dataSource={isMock ? MOCK_TABLE : usersData}
            rowKey="_id"
            loading={!isMock && usersLoading}
            pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: isMock ? MOCK_TABLE.length : pagination.total, showSizeChanger: false, size: 'small' }}
            onChange={handleTableChange}
            scroll={{ x: true }}
            size="small"
            locale={{ emptyText: 'No data' }}
          />
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={30}
                dataKey="value"
                paddingAngle={3}
              >
                {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {statusChartData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span>{entry.name}</span>
                </div>
                <span className="font-semibold tabular-nums">{entry.value}</span>
              </div>
            ))}
          </div>

          {/* Company bar chart */}
          <h3 className="text-sm font-semibold text-slate-800 mt-5 mb-3">Slots by Company</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={isMock ? MOCK_COMPANIES : (companyOptions.length ? companyOptions.map(c => ({ company: c.label, slotCount: 0 })) : MOCK_COMPANIES)} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="company" tick={{ fontSize: 10 }} width={70} />
              <Tooltip />
              <Bar dataKey="slotCount" fill="#f59e0b" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;