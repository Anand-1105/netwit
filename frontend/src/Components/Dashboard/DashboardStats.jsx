import React, { useState, useEffect, useContext, useRef } from 'react';
import Axios from '../../Api/Axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { UserContext } from '../../Context/UserContext';
import { Table, Input, Select, Button, ConfigProvider, theme } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { FiChevronDown, FiRefreshCw } from 'react-icons/fi';

// ── Dark custom select — replaces native <select> to avoid OS white popup ─────
const DarkSelect = ({ value, onChange, options, disabled, placeholder, minWidth }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative" style={{ minWidth: minWidth || 140 }}>
      <button type="button" onClick={() => !disabled && setOpen(o => !o)} disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white/70 hover:border-amber-500/50 focus:outline-none focus:border-amber-500 disabled:opacity-40 transition-colors">
        <span className="truncate">{selected?.label || placeholder || 'Select...'}</span>
        <FiChevronDown size={13} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
          {options.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${value === o.value ? 'bg-amber-500/20 text-amber-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Mock data for presentation ────────────────────────────────────────────────
const MOCK_STATUS = [
  { name: 'Completed', value: 187, fill: '#10b981' },
  { name: 'Scheduled', value: 94,  fill: '#3b82f6' },
  { name: 'Pending',   value: 63,  fill: '#f59e0b' },
  { name: 'Removed',   value: 12,  fill: '#ef4444' },
];
const MOCK_COMPANIES = [
  { company: 'AWS',          slotCount: 38 },
  { company: 'Microsoft',    slotCount: 31 },
  { company: 'Google Cloud', slotCount: 27 },
  { company: 'Salesforce',   slotCount: 22 },
  { company: 'SAP',          slotCount: 19 },
  { company: 'Oracle',       slotCount: 15 },
  { company: 'VMware',       slotCount: 11 },
];
const MOCK_STATS = { totalUsers: 356, giftsCollected: 142, totalEvents: 4 };
const MOCK_TABLE = [
  { _id: 'm1',  firstName: 'Subrahmanya', lastName: 'Gupta',    email: 'sgupta@brigade.com',      slots: { company: 'AWS',          timeSlot: '10:00', completed: true  } },
  { _id: 'm2',  firstName: 'Kapil',       lastName: 'Pal',      email: 'kpal@energizer.com',      slots: { company: 'Microsoft',    timeSlot: '10:20', completed: true  } },
  { _id: 'm3',  firstName: 'Sheikh',      lastName: 'Osmany',   email: 'sosmany@ioc.com',         slots: { company: 'Google Cloud', timeSlot: '10:40', completed: false } },
  { _id: 'm4',  firstName: 'Ramkumar',    lastName: 'Mohan',    email: 'rmohan@tata.com',         slots: { company: 'Salesforce',   timeSlot: '11:00', completed: true  } },
  { _id: 'm5',  firstName: 'Priya',       lastName: 'Sharma',   email: 'psharma@infosys.com',     slots: { company: 'SAP',          timeSlot: '11:20', completed: false } },
  { _id: 'm6',  firstName: 'Anand',       lastName: 'Krishnan', email: 'akrishnan@wipro.com',     slots: { company: 'Oracle',       timeSlot: '11:40', completed: true  } },
  { _id: 'm7',  firstName: 'Deepa',       lastName: 'Nair',     email: 'dnair@hcl.com',           slots: { company: 'VMware',       timeSlot: '12:00', completed: false } },
  { _id: 'm8',  firstName: 'Vikram',      lastName: 'Singh',    email: 'vsingh@techm.com',        slots: { company: 'AWS',          timeSlot: '12:20', completed: true  } },
  { _id: 'm9',  firstName: 'Meera',       lastName: 'Iyer',     email: 'miyer@cognizant.com',     slots: { company: 'Microsoft',    timeSlot: '12:40', completed: false } },
  { _id: 'm10', firstName: 'Rajesh',      lastName: 'Verma',    email: 'rverma@accenture.com',    slots: { company: 'Google Cloud', timeSlot: '13:00', completed: true  } },
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

  // Auto-refresh every 30s when an event is selected
  useEffect(() => {
    if (!selectedEvent) return;
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchUsersData();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedEvent, timeRange, filters]);

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
    if (!selectedEvent) return;
    
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
      
      if (response.data.success) {
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
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  const { statistics } = dashboardData || {};
  const isMock = !selectedEvent || (selectedEvent && !statistics?.totalUsers && usersData.length === 0 && !usersLoading);

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
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorBgContainer: '#1a1a1a', colorBgElevated: '#222', colorBorder: 'rgba(255,255,255,0.1)', colorText: 'rgba(255,255,255,0.7)', colorTextSecondary: 'rgba(255,255,255,0.4)', colorPrimary: '#f59e0b', colorBgBase: '#0f0f0f', borderRadius: 6 } }}>
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          {isMock && <p className="text-xs text-amber-500 mt-0.5">Showing sample data — no real data found for this selection</p>}
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <DarkSelect
            value={timeRange}
            onChange={setTimeRange}
            options={[{ value: 'all', label: 'All Time' }, { value: 'week', label: 'Last Week' }, { value: 'month', label: 'Last Month' }]}
          />
          <DarkSelect
            value={selectedEvent}
            onChange={(v) => { setSelectedEvent(v); setPagination(p => ({ ...p, current: 1 })); setFilters({ company: '', slot: '', status: '', sortBy: 'desc' }); }}
            options={[{ value: '', label: 'All Events' }, ...eventOptions]}
            disabled={eventsLoading}
            placeholder="All Events"
            minWidth={200}
          />
          <button onClick={() => { fetchDashboardData(); if (selectedEvent) { fetchUsersData(); fetchFilterOptions(); } }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors">
            <FiRefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Attendees', value: displayStats.totalUsers, color: 'text-blue-400' },
          { label: 'Gifts Collected', value: displayStats.giftsCollected, color: 'text-emerald-400' },
          { label: 'Events', value: displayStats.totalEvents, color: 'text-amber-400' },
          { label: 'Completion Rate', value: isMock ? '52%' : (statistics?.statusDistribution?.completed && displayStats.totalUsers ? Math.round((statistics.statusDistribution.completed / displayStats.totalUsers) * 100) + '%' : '—'), color: 'text-purple-400' },
        ].map(card => (
          <div key={card.label} className="bg-[#1a1a1a] border border-white/10 rounded-lg p-5">
            <p className="text-xs text-white/40 mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts + table row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Users table */}
        <div className="lg:col-span-3 bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/80">Attendee Slots</h3>
            <Button icon={<ReloadOutlined />} onClick={fetchUsersData} loading={usersLoading} size="small">Refresh</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <Input placeholder="Search..." prefix={<SearchOutlined />} value={filters.search || ''} onChange={e => handleFilterChange('search', e.target.value)} allowClear size="small" />
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
                return <span className={`px-2 py-0.5 rounded text-xs font-medium ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{done ? 'Completed' : 'Pending'}</span>;
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

        {/* Pie + bar charts */}
        <div className="lg:col-span-2 bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white/80 mb-3">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={65} innerRadius={30} dataKey="value" paddingAngle={3}>
                {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
                labelStyle={{ color: '#fff', fontWeight: 600 }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {statusChartData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span>{entry.name}</span>
                </div>
                <span className="font-semibold tabular-nums text-white/70">{entry.value}</span>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-semibold text-white/80 mt-5 mb-3">Slots by Company</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={isMock ? MOCK_COMPANIES : MOCK_COMPANIES}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="company" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.5)' }} width={90} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
                labelStyle={{ color: '#fff', fontWeight: 600 }}
                itemStyle={{ color: '#fff' }}
                formatter={(v) => [v, 'Slots']}
              />
              <Bar dataKey="slotCount" fill="#f59e0b" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    </ConfigProvider>
  );
};

export default DashboardStats;