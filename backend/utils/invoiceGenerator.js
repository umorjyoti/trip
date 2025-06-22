const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional invoice PDF for a booking
 * @param {Object} booking - Booking object with populated trek and user
 * @param {Object} payment - Payment details from Razorpay
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateInvoicePDF = async (booking, payment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        bufferPages: true
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Company Header
      doc.fontSize(24).font('Helvetica-Bold').text('🏔️ Trek Adventures', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Your Adventure Awaits', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text('123 Adventure Street, Mountain City, MC 12345', { align: 'center' });
      doc.text('Phone: +91 98765 43210 | Email: info@trekadventures.com', { align: 'center' });
      doc.text('GSTIN: 12ABCDE1234F1Z5', { align: 'center' });
      
      doc.moveDown(2);

      // Invoice Header
      doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Invoice Details Table
      const invoiceTableTop = doc.y;
      const leftColumn = 50;
      const rightColumn = 300;

      // Left Column - Invoice Info
      doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details:', leftColumn, invoiceTableTop);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Invoice No: INV-${booking._id.toString().slice(-8).toUpperCase()}`, leftColumn, invoiceTableTop + 20);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, leftColumn, invoiceTableTop + 35);
      doc.text(`Due Date: ${new Date().toLocaleDateString('en-IN')}`, leftColumn, invoiceTableTop + 50);
      doc.text(`Payment ID: ${payment.id}`, leftColumn, invoiceTableTop + 65);

      // Right Column - Customer Info
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', rightColumn, invoiceTableTop);
      doc.fontSize(9).font('Helvetica');
      doc.text(booking.user.name, rightColumn, invoiceTableTop + 20);
      doc.text(booking.user.email, rightColumn, invoiceTableTop + 35);
      doc.text(booking.user.phone || 'N/A', rightColumn, invoiceTableTop + 50);

      doc.moveDown(3);

      // Booking Details
      doc.fontSize(12).font('Helvetica-Bold').text('Booking Details:');
      doc.moveDown(0.5);

      const bookingTableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 350;
      const col4 = 450;

      // Table Headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', col1, bookingTableTop);
      doc.text('Details', col2, bookingTableTop);
      doc.text('Quantity', col3, bookingTableTop);
      doc.text('Amount', col4, bookingTableTop);

      // Table Content
      doc.fontSize(9).font('Helvetica');
      let currentY = bookingTableTop + 20;

      // Trek Details
      doc.text('Trek Package', col1, currentY);
      doc.text(booking.trek.name, col2, currentY);
      doc.text(booking.numberOfParticipants.toString(), col3, currentY);
      doc.text(`₹${booking.totalPrice}`, col4, currentY);

      currentY += 20;

      // Batch Details
      if (booking.batch) {
        doc.text('Trek Dates', col1, currentY);
        const startDate = new Date(booking.batch.startDate).toLocaleDateString('en-IN');
        const endDate = new Date(booking.batch.endDate).toLocaleDateString('en-IN');
        doc.text(`${startDate} to ${endDate}`, col2, currentY);
        doc.text('-', col3, currentY);
        doc.text('-', col4, currentY);
        currentY += 20;
      }

      // Add-ons if any
      if (booking.addOns && booking.addOns.length > 0) {
        booking.addOns.forEach(addOn => {
          doc.text(addOn.name, col1, currentY);
          doc.text(addOn.description || '-', col2, currentY);
          doc.text('1', col3, currentY);
          doc.text(`₹${addOn.price || 0}`, col4, currentY);
          currentY += 20;
        });
      }

      // Draw table lines
      doc.strokeColor('#000000').lineWidth(0.5);
      doc.moveTo(col1, bookingTableTop + 15).lineTo(col4 + 100, bookingTableTop + 15).stroke();
      doc.moveTo(col1, currentY).lineTo(col4 + 100, currentY).stroke();

      doc.moveDown(2);

      // Payment Summary
      const summaryTop = doc.y;
      const summaryRight = 500;

      doc.fontSize(11).font('Helvetica-Bold').text('Payment Summary:', summaryRight, summaryTop);
      doc.fontSize(10).font('Helvetica');
      
      let summaryY = summaryTop + 20;
      
      // Base Amount
      const baseAmount = booking.totalPrice;
      doc.text('Base Amount:', summaryRight, summaryY);
      doc.text(`₹${baseAmount}`, summaryRight + 100, summaryY);
      summaryY += 20;

      // GST (if applicable)
      if (booking.trek.gstPercent && booking.trek.gstPercent > 0) {
        const gstAmount = (baseAmount * booking.trek.gstPercent / 100);
        doc.text(`GST (${booking.trek.gstPercent}%):`, summaryRight, summaryY);
        doc.text(`₹${gstAmount.toFixed(2)}`, summaryRight + 100, summaryY);
        summaryY += 20;
      }

      // Payment Gateway Charges (if applicable)
      if (booking.trek.gatewayPercent && booking.trek.gatewayPercent > 0) {
        const gatewayAmount = (baseAmount * booking.trek.gatewayPercent / 100);
        doc.text(`Gateway Charges (${booking.trek.gatewayPercent}%):`, summaryRight, summaryY);
        doc.text(`₹${gatewayAmount.toFixed(2)}`, summaryRight + 100, summaryY);
        summaryY += 20;
      }

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total Amount:', summaryRight, summaryY);
      doc.text(`₹${payment.amount / 100}`, summaryRight + 100, summaryY);

      // Payment Status
      doc.moveDown(2);
      doc.fontSize(11).font('Helvetica-Bold').text('Payment Status: PAID', { color: '#10b981' });
      doc.fontSize(9).font('Helvetica').text(`Payment Method: ${payment.method}`, { color: '#6b7280' });
      doc.text(`Payment Date: ${new Date().toLocaleDateString('en-IN')}`, { color: '#6b7280' });

      // Terms and Conditions
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:');
      doc.fontSize(8).font('Helvetica');
      doc.text('• This invoice is computer generated and does not require a signature.');
      doc.text('• Payment is non-refundable unless specified in our cancellation policy.');
      doc.text('• Please keep this invoice for your records.');
      doc.text('• For any queries, please contact us at support@trekadventures.com');

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text('Thank you for choosing Trek Adventures!', { align: 'center', color: '#6b7280' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF }; 