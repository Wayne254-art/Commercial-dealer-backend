import { DataTypes } from 'sequelize';

const MakeModel = (sequelize) => {
    return sequelize.define('Make', {
        makeId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        tableName: 'makes',
        timestamps: true,
    });
}

export default MakeModel;
