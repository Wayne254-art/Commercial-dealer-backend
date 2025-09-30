import { DataTypes } from 'sequelize';

const CategoryModel = (sequelize) => {
    return sequelize.define('Category', {
        categoryId: {
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
        tableName: 'categorys',
        timestamps: true,
    });
}

export default CategoryModel;
