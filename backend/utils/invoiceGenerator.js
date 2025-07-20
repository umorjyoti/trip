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
      doc.fontSize(24).font('Helvetica-Bold').text('Bengaluru Trekkers', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Your Adventure Awaits', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text('21, MG Road, Bengaluru, KA 560001', { align: 'center' });
      doc.text('Phone: +91 98765 43210 | Email: info@bengalurutrekkers.com', { align: 'center' });
      doc.text('GSTIN: 12ABCDE1234F1Z5', { align: 'center' });
      doc.moveDown(2);

      // Invoice Header
      doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Invoice Details Table
      const invoiceTableTop = doc.y;
      const leftColumn = 50;
      const rightColumn = 320;

      // Left Column - Invoice Info
      doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details:', leftColumn, invoiceTableTop);
      doc.fontSize(9).font('Helvetica');
      
      // Generate invoice number with payment type prefix
      let invoicePrefix = 'INV';
      if (booking.paymentMode === 'partial') {
        if (booking.status === 'payment_confirmed_partial') {
          invoicePrefix = 'PP-INV'; // Partial Payment Invoice
        } else if (booking.status === 'confirmed') {
          invoicePrefix = 'FP-INV'; // Final Payment Invoice
        }
      }
      
      doc.text(`Invoice No: ${invoicePrefix}-${booking._id.toString().slice(-8).toUpperCase()}`, leftColumn, invoiceTableTop + 20);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, leftColumn, invoiceTableTop + 35);
      doc.text(`Due Date: ${new Date().toLocaleDateString('en-IN')}`, leftColumn, invoiceTableTop + 50);
      doc.text(`Payment ID: ${payment.id ? payment.id : 'N/A'}`, leftColumn, invoiceTableTop + 65);

      // Right Column - Customer Info
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', rightColumn, invoiceTableTop);
      doc.fontSize(9).font('Helvetica');
      doc.text(booking.user.name, rightColumn, invoiceTableTop + 20);
      doc.text(booking.user.email, rightColumn, invoiceTableTop + 35);
      doc.text(booking.user.phone || 'N/A', rightColumn, invoiceTableTop + 50);

      doc.moveDown(3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Booking Details
      doc.fontSize(12).font('Helvetica-Bold').text('Booking Details:');
      doc.moveDown(0.5);

      const bookingTableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 350;
      const col4 = 430;

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
      doc.text((booking.numberOfParticipants || booking.participants || 1).toString(), col3, currentY);
      doc.text(`Rs. ${(booking.totalPrice).toFixed(2)}`, col4, currentY);
      currentY += 20;

      // Batch Details
      if (booking.batch) {
        doc.text('Trek Dates', col1, currentY);
        let startDate = booking.batch.startDate ? new Date(booking.batch.startDate).toLocaleDateString('en-IN') : 'N/A';
        let endDate = booking.batch.endDate ? new Date(booking.batch.endDate).toLocaleDateString('en-IN') : 'N/A';
        if (startDate === 'Invalid Date') startDate = 'N/A';
        if (endDate === 'Invalid Date') endDate = 'N/A';
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
          doc.text(`Rs. ${(addOn.price || 0).toFixed(2)}`, col4, currentY);
          currentY += 20;
        });
      }

      // Draw table lines
      doc.strokeColor('#000000').lineWidth(0.5);
      doc.moveTo(col1, bookingTableTop + 15).lineTo(col4 + 80, bookingTableTop + 15).stroke();
      doc.moveTo(col1, currentY).lineTo(col4 + 80, currentY).stroke();

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Payment Summary (as a table, left-aligned)
      doc.fontSize(12).font('Helvetica-Bold').text('Payment Summary:', 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      let summaryY = doc.y;
      let summaryX1 = 60;
      let summaryX2 = 220;

      // Base Amount
      const baseAmount = booking.totalPrice;
      doc.text('Base Amount:', summaryX1, summaryY);
      doc.text(`Rs. ${baseAmount.toFixed(2)}`, summaryX2, summaryY);
      summaryY += 18;

      // GST (if applicable)
      if (booking.trek.gstPercent && booking.trek.gstPercent > 0) {
        const gstAmount = (baseAmount * booking.trek.gstPercent / 100);
        doc.text(`GST (${booking.trek.gstPercent}%):`, summaryX1, summaryY);
        doc.text(`Rs. ${gstAmount.toFixed(2)}`, summaryX2, summaryY);
        summaryY += 18;
      }

      // Payment Gateway Charges (if applicable)
      if (booking.trek.gatewayPercent && booking.trek.gatewayPercent > 0) {
        const gatewayAmount = (baseAmount * booking.trek.gatewayPercent / 100);
        doc.text(`Gateway Charges (${booking.trek.gatewayPercent}%):`, summaryX1, summaryY);
        doc.text(`Rs. ${gatewayAmount.toFixed(2)}`, summaryX2, summaryY);
        summaryY += 18;
      }

      // Total
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Total Amount:', summaryX1, summaryY);
      
      // Show appropriate amount based on payment mode
      let displayAmount = booking.totalPrice;
      if (booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
        if (booking.status === 'payment_confirmed_partial') {
          // Show initial payment amount for partial payments
          displayAmount = booking.partialPaymentDetails.initialAmount || booking.totalPrice;
        } else if (booking.status === 'confirmed') {
          // Show total amount for completed partial payments
          displayAmount = booking.totalPrice;
        }
      }
      
      doc.text(`Rs. ${displayAmount.toFixed(2)}`, summaryX2, summaryY);
      summaryY += 22;

      // Partial Payment Information
      if (booking.paymentMode === 'partial' && booking.partialPaymentDetails && 
          booking.status !== 'confirmed' && booking.status !== 'payment_completed') {
        doc.fontSize(10).font('Helvetica-Bold').text('Payment Mode: PARTIAL PAYMENT', summaryX1, summaryY);
        summaryY += 18;
        
        // Initial Payment
        doc.fontSize(10).font('Helvetica');
        doc.text('Initial Payment:', summaryX1, summaryY);
        doc.text(`Rs. ${booking.partialPaymentDetails.initialAmount?.toFixed(2) || '0.00'}`, summaryX2, summaryY);
        summaryY += 18;
        
        // Remaining Balance
        doc.text('Remaining Balance:', summaryX1, summaryY);
        doc.text(`Rs. ${booking.partialPaymentDetails.remainingAmount?.toFixed(2) || '0.00'}`, summaryX2, summaryY);
        summaryY += 18;
        
        // Due Date
        if (booking.partialPaymentDetails.finalPaymentDueDate) {
          doc.text('Final Payment Due Date:', summaryX1, summaryY);
          doc.text(new Date(booking.partialPaymentDetails.finalPaymentDueDate).toLocaleDateString('en-IN'), summaryX2, summaryY);
          summaryY += 18;
        }
        
        // Payment Status based on booking status
        doc.fontSize(10).font('Helvetica-Bold');
        if (booking.status === 'payment_confirmed_partial') {
          doc.text('Payment Status: PARTIAL PAYMENT RECEIVED', summaryX1, summaryY);
          summaryY += 18;
          doc.fontSize(9).font('Helvetica').text('Remaining balance pending', summaryX1, summaryY);
        }
        summaryY += 18;
      } else {
        // Full Payment Information
        doc.fontSize(10).font('Helvetica-Bold').text('Payment Status: FULL PAYMENT', summaryX1, summaryY);
        summaryY += 18;
      }
      
      doc.fontSize(9).font('Helvetica').text(`Payment Method: ${payment.method || 'N/A'}`, summaryX1, summaryY);
      summaryY += 14;
      doc.text(`Payment Date: ${new Date().toLocaleDateString('en-IN')}`, summaryX1, summaryY);

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Terms and Conditions
      doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:');
      doc.fontSize(8).font('Helvetica');
      doc.text('• This invoice is computer generated and does not require a signature.');
      doc.text('• Payment is non-refundable unless specified in our cancellation policy.');
      doc.text('• Please keep this invoice for your records.');
      doc.text('• For any queries, please contact us at support@bengalurutrekkers.com');
      
      // Partial Payment Terms
      if (booking.paymentMode === 'partial' && booking.partialPaymentDetails && 
          booking.status !== 'confirmed' && booking.status !== 'payment_completed') {
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica-Bold').text('Partial Payment Terms:');
        doc.fontSize(8).font('Helvetica');
        doc.text('• Remaining balance must be paid before the due date specified above.');
        doc.text('• Failure to pay the remaining amount may result in booking cancellation.');
        doc.text('• Partial payments are non-refundable once the initial payment is processed.');
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text('Thank you for choosing Bengaluru Trekkers!', { align: 'center', color: '#6b7280' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF }; 