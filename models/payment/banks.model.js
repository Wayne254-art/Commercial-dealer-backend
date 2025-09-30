import { DataTypes } from 'sequelize';

const BankModel = (sequelize) => { 
    return sequelize.define('BankAccount', {
    bankId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    label: {
        type: DataTypes.STRING, // e.g. "M-PESA Till", "Equity Bank"
        allowNull: false
    },
    value: {
        type: DataTypes.STRING, // e.g. "MPTILL", "68"
        allowNull: false,
        unique: true
    },
}, {
    tableName: 'supported_banks',
    timestamps: true
});
};

export default BankModel
