import { DataTypes } from 'sequelize'

const PackageModel = (sequelize) => {
    return sequelize.define('Package', {
        packageId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        services: {
            type: DataTypes.JSON,
            allowNull: false
        },
        seltype: {
            type: DataTypes.ENUM('dealer', 'garage', 'both'),
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        isRecommended: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        }
    }, {
        tableName: 'packages',
        timestamps: true
    })
}

export default PackageModel