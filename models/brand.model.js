import { DataTypes } from 'sequelize';

const BrandModel = (sequelize) => {
    return sequelize.define('Brand', {
        brandId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    }, {
        tableName: 'brands',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['name', 'categoryId'],
            }
        ]
    });
}

export default BrandModel;
