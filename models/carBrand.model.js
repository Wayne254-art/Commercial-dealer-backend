import { DataTypes } from 'sequelize';

const CarBrandModel = (sequelize) => {
    return sequelize.define('Model', {
        modelId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        makeId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    }, {
        tableName: 'models',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['name', 'makeId'],
            }
        ]
    });
}

export default CarBrandModel
