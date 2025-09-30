
import { DataTypes } from 'sequelize'

const CustomerModel = (sequelize) => {
    return sequelize.define('customer', {
        customerId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        method: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        OTP: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        OTPExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        }
    }, {
        timestamps: true,
        tableName: 'customers',
        defaultScope: {
            attributes: { exclude: ['password'] }
        }
    })
}

export default CustomerModel