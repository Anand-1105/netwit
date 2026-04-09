import React from 'react';
import Axios from '../Api/Axios';
import ExcelJS from 'exceljs';
import { FiDownload } from 'react-icons/fi';

const DownloadReport = ({ id }) => {
  const handleDownload = async () => {
    try {
      const res = await Axios.get(`/events/report/${id}`);
      const data = res.data;
console.log(data);

      // Create a workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');
      // Extract unique company names from users
      // Extract unique company names from selectedBy fields of all users
      const uniqueCompanies = Array.from(new Set(
        (data.users || []).flatMap(u => Array.isArray(u.selectedBy) ? u.selectedBy.map(s => s.name).filter(Boolean) : [])
      ));
      // Add a title row with companies
      worksheet.addRow([`Companies: ${uniqueCompanies.join(', ')}`]);
      worksheet.addRow([]); // Empty row for spacing

      // Define columns (customize as needed)
      worksheet.columns = [
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Title', key: 'title', width: 20 },
        { header: 'Gift Collected', key: 'giftCollected', width: 15 },
        { header:'Comment', key: 'comment', width: 20 },
        ...uniqueCompanies.map(company => ({ header: company, key: `company_${company.replace(/\W/g, '_')}`, width: 20 }))
      ];

      // Add rows (customize as needed)
      if (Array.isArray(data.users)) {
        data.users.forEach(user => {
          // Build row with company columns
          const companyColumns = {};
          uniqueCompanies.forEach(company => {
            // Find a completed slot for this user and company
            const hasCompletedSlot = Array.isArray(data.slots) && data.slots.some(slot => 
              slot.userId._id === user._id && slot.company === company && slot.completed === true
            );
            
            companyColumns[`company_${company.replace(/\W/g, '_')}`] = hasCompletedSlot ? 1 : '';
          });
          worksheet.addRow({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            title: user.title,
            giftCollected: user.giftCollected ? 'Yes' : 'No',
            comment: user.comment,
            ...companyColumns
          });
        });
      }

      // Generate buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${data.eventDetails.title}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-md text-white/50 hover:text-white/80 text-sm transition-colors" onClick={handleDownload}>
      <FiDownload size={13} /> Report
    </div>
  );
};

export default DownloadReport;