import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import formidable from 'formidable';
import { responseReturn } from '../../utils/response.js';
import { db } from '../../models/index.js';

// Setup directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadRoot = path.join(__dirname, '../../uploads');
const imageDir = path.join(uploadRoot, 'team');

// Ensure directories exist
[uploadRoot, imageDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class teamControllers {

    create_team_member = async (req, res) => {
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: "Form parse error" });
            }

            try {
                const name = String(fields.name).trim();
                const role = String(fields.role).trim();
                const email = String(fields.email).trim();
                const phone = String(fields.phone).trim();

                // Handle image
                let image = files.image;
                if (Array.isArray(image)) {
                    image = image[0];
                }

                const serverUrl = `${req.protocol}://${req.get("host")}`;
                const timestamp = Date.now();
                const extension = path.extname(image.originalFilename || '');
                const safeName = `team-${timestamp}${extension}`.replace(/\s+/g, "-");
                const newFilePath = path.join(imageDir, safeName);
                const imageUrl = `${serverUrl}/uploads/team/${safeName}`;

                fs.renameSync(image.filepath, newFilePath);

                const newMember = await db.Team.create({
                    name,
                    role,
                    email,
                    phone,
                    image: imageUrl,
                });

                return responseReturn(res, 201, {
                    message: "added successfully",
                    newMember,
                });
            } catch (error) {
                console.error(error);
                return responseReturn(res, 500, {
                    error: "Failed to create team member",
                });
            }
        });
    };

    get_all_team_members = async (req, res) => {
        try {
            const members = await db.Team.findAll();
            return res.status(200).json(members);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching team members', error });
        }
    };

    get_team_member_by_memberId = async (req, res) => {
        try {
            const member = await db.Team.findByPk(req.params.id);
            if (!member) {
                return res.status(404).json({ message: 'Team member not found' });
            }
            return res.status(200).json(member);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching team member', error });
        }
    };

    update_team_member = async (req, res) => {
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({ message: "Form parse error" });
            }

            try {
                const memberId = req.params.memberId;
                const member = await db.Team.findByPk(memberId);

                const name = fields.name ? String(fields.name).trim() : member.name;
                const role = fields.role ? String(fields.role).trim() : member.role;
                const email = fields.email ? String(fields.email).trim() : member.email;
                const phone = fields.phone ? String(fields.phone).trim() : member.phone;

                let imageUrl = member.image;
                if (files.image) {
                    let image = files.image;
                    if (Array.isArray(image)) {
                        image = image[0];
                    }

                    const serverUrl = `${req.protocol}://${req.get("host")}`;
                    const timestamp = Date.now();
                    const extension = path.extname(image.originalFilename || '');
                    const safeName = `team-${timestamp}${extension}`.replace(/\s+/g, "-");
                    const newFilePath = path.join(imageDir, safeName);
                    imageUrl = `${serverUrl}/uploads/team/${safeName}`;

                    fs.renameSync(image.filepath, newFilePath);
                }

                member.name = name;
                member.role = role;
                member.email = email;
                member.phone = phone;
                member.image = imageUrl;

                await member.save();

                return res.status(200).json({
                    message: "updated successfully",
                    member,
                });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Error updating team member", error });
            }
        });
    };

    delete_team_member = async (req, res) => {
        try {
            const member = await db.Team.findByPk(req.params.memberId);
            await member.destroy();
            return res.status(200).json({ message: 'deleted successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting team member', error });
        }
    };

}

export default new teamControllers()