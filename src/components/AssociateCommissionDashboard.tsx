import React, { useState } from 'react';
import { useAssociateCommission } from '../hooks/useAssociateCommission';
import { DailyCommissionGroup, CommissionTask } from '../types/commission';
import { getTodayISODate } from '../utils/commissionUtils';
import { CommissionMetricCards } from './CommissionMetricCards';
import { DailyCommissionCards } from './DailyCommissionCards';
import { CommissionDrilldownModal } from './CommissionDrilldownModal';

interface AssociateCommissionDashboardProps {
  associateId: string;
  tasks: CommissionTask[];
  paidCommissionAmount?: number;
  todayLabel?: string;
  isAdmin?: boolean;
  onDisbursePayout?: (associateId: string, amount: number) => void;
}

export const AssociateCommissionDashboard: React.FC<AssociateCommissionDashboardProps> = ({
  associateId,
  tasks = [],
  paidCommissionAmount = 0,
  todayLabel = 'Today',
  isAdmin = false,
  onDisbursePayout
}) => {
  const todayStr = getTodayISODate();

  const { todayEarned, pendingPayout, totalAccumulated, dailyGroups } = useAssociateCommission(
    associateId,
    tasks,
    paidCommissionAmount,
    todayStr
  );

  const [selectedGroup, setSelectedGroup] = useState<DailyCommissionGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSelectDate = (group: DailyCommissionGroup) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };

  return (
    <div className="space-y-5">
      {/* 1. Streamlined Summary Cards (Total Earned, Pending Payout, Today's Earned) */}
      <CommissionMetricCards
        totalAccumulated={totalAccumulated}
        pendingPayout={pendingPayout}
        todayEarned={todayEarned}
        paidAmount={paidCommissionAmount}
        todayLabel={todayLabel}
        isAdmin={isAdmin}
        onOpenPayoutModal={() => onDisbursePayout && onDisbursePayout(associateId, pendingPayout)}
      />

      {/* 2. Progressive Paginated Daily History Cards (4 Days Default -> 12 Days Paginated) */}
      <DailyCommissionCards
        dailyGroups={dailyGroups}
        todayStr={todayStr}
        onSelectDate={handleSelectDate}
      />

      {/* 3. Detailed Service Breakdown Drilldown Modal */}
      <CommissionDrilldownModal
        group={selectedGroup}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AssociateCommissionDashboard;
