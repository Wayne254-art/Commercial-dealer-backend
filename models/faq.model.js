// models/faq.js
import { DataTypes } from 'sequelize'

const FAQModel = (sequelize) => {
    return sequelize.define('FAQ', {
        faqId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        question: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        answer: {
            type: DataTypes.TEXT,
            allowNull: false,
        }
    }, {
        tableName: 'faqs',
        timestamps: true,
    });
}

export default FAQModel;
