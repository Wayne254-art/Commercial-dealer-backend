import { DataTypes } from 'sequelize'

const ReviewModel = (sequelize) => {
    return sequelize.define('reviews', {
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rating: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        review: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    }, {
        tableName: 'reviews',
        timestamps: true
    })
}

export default ReviewModel