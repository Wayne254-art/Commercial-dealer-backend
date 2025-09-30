import { DataTypes } from 'sequelize'

const WithdrawalRequestModel = (sequelize) => {
    return sequelize.define('SWithdrawalRequest', {
        requestId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending'
        },
    }, {
        tableName: 'withdrawal_requests',
        timestamps: true
    })
}

export default WithdrawalRequestModel