import { DataTypes } from 'sequelize';

const ContactModel = (sequelize) => {
    return sequelize.define('Contact', {
        queryId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isEmail: true },
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        privacyPolicyAccepted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    }, {
        tableName: 'contact_query',
        timestamps: true,
    });
}

export default ContactModel;
