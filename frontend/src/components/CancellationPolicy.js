import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const CancellationPolicy = () => {
  return (
    <div className="mt-12 scroll-mt-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Cancellation Policy
      </h2>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Policy Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upto 21 days
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  20-15 days
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  14-8 days
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  7-0 days
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                  Batch Shifting
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  <FaCheck className="h-4 w-4 text-green-500" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  <FaTimes className="h-4 w-4 text-red-500" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  <FaTimes className="h-4 w-4 text-red-500" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  <FaTimes className="h-4 w-4 text-red-500" />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                  Cancellation Charge
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  Free Cancellation
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  25% of the Trip Amount
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  50% of the Trip Amount
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  100% of the Trip Amount
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                  Booking Amount
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  Refunded in mode of original payment
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  Adjusted in Refund Deduction
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  Adjusted in Refund Deduction
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  No Refund
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                  Remaining Amount
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  Full Refund (minus) booking amount
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  Refund (minus) 25% of the trip amount
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  Refund (minus) 50% of the trip amount
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                  No Refund
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Notes */}
      <div className="mt-6 space-y-4">
        {/* <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Credit Note:</strong> The booking amount will be credited to your JW Profile accessible by logging in via email ID. Credit Notes have no expiry date and can be used for future trips.
              </p>
            </div>
          </div>
        </div> */}

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>GST:</strong> Any GST charged on any transaction will not be refunded.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>Pending Refund:</strong> Any refund pending on your booking will be credited to the same mode of payment through which you paid in 5-7 working days.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>Partial Refund:</strong> Any case in which a partial refund will be issued will be calculated after deducting the Booking Amount and Cancellation Charges depending on the time of Cancellation.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>Remaining Amount:</strong> Will be calculated on the amount paid over and above the booking amount.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Bypass Policy:</strong> Any and all Cancellation Policies are superseded by the Emergency Case Cancellation Policy in case of situations such as war, pandemics, force majeure, or similar extraordinary events affecting the tour region.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy; 