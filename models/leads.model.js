import { DataTypes } from 'sequelize';

const LeadModel = (sequelize) => {
    return sequelize.define('Leads', {
        leadId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        listing_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        seller_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        lead_type: {
            type: DataTypes.ENUM('chat', 'call', 'whatsapp'),
            allowNull: false,
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: false
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: false
        },
    }, {
        tableName: 'listing_leads',
        timestamps: true,
    });
}

export default LeadModel