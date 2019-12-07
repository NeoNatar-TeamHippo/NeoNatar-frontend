const {
    CREATED, OK,
} = require('http-status-codes');

const { db } = require('../utils/firebase');
const validateCampaignInput = require('../validations/campaignInput');
const { getLocationsAmount } = require('../utils/functions');
const { tryCatchError, validationError } = require('../utils/errorHandler');
const { successNoData, successNoMessage } = require('../utils/successHandler');

const Campaign = {
    /**
	 * The Campaign Routes
	 * @function
	 * @param {object} req - request object
	 * @param {object} res - response object
	 * @return  {Object} result
    */
    async create(req, res) {
        try {
            const { valid, errors } = await validateCampaignInput(req.body);
            if (!valid) validationError(res, errors);
            req.body.createdAt = new Date().toISOString();
            req.body.createdBy = req.user.uid;
            let amount = await getLocationsAmount(req.body.locationsSelected);
            amount = amount.reduce((a, b) => a + b, 0);
            req.body.amount = amount * req.body.duration;
            if (valid) {
                await db.collection('campaigns').doc().create(req.body)
                    .then(
                        ref => ref);
                return successNoData(res, CREATED, 'Campaign successfully created');
            }
        } catch (error) {
            return tryCatchError(res, error);
        }
    },

    async deleteCampaign(req, res) {
        try {
            const campaign = await db.collection('campaigns').doc(req.params.id);
            if (!campaign) {
                return validationError(res, 'campaign not found');
            }
            await campaign.delete();
            return successNoData(res, OK, 'Campaign deleted successfully');
        } catch (error) {
            tryCatchError(res, error);
        }
    },

    async getAll(req, res) {
        try {
            const campaigns = [];
            const { uid } = req.user;
            await db.collection('campaigns').where('createdBy', '==', uid)
                .orderBy('createdAt', 'desc').get().then(querySnapshot => {
                    const docs = querySnapshot.docs;
                    for (const doc of docs) {
                        const selectedItem = {
                            id: doc.id,
                            campaign: doc.data(),
                        };
                        campaigns.push(selectedItem);
                    } return campaigns;
                });
            return successNoMessage(res, OK, campaigns);
        } catch (error) {
            tryCatchError(res, error);
        }
    },

    async getOne(req, res) {
        try {
            const document = db.collection('camapigns').doc(req.params.id);
            if (!document) {
                return validationError(res, 'Document not found');
            }
            const documentData = await document.get();
            const campaign = documentData.data();
            if(campaign.createdBy !== req.user.uid) {
                return validationError(res, 'Not Authorized');
            }
            return successNoMessage(res, OK, savedLocations);
        } catch (error) {
            tryCatchError(res, error);
        }
    },

    async updateCampaign(req, res) {
        try {
            const document = db.collection('campaigns').doc(req.params.id);
            if (!document) validationError(res, errors);
            const { valid, errors } = await validateCampaignInput(req.body);
            if (!valid) validationError(res, errors);
            req.body.updatedAt = new Date().toISOString();
            req.body.updatedBy = req.user.uid;
            let amount = await getLocationsAmount(req.body.locationsSelected);
            amount = amount.reduce((a, b) => a + b, 0);
            req.body.amount = amount * req.body.duration;
            if (valid) {
                await document.update(req.body);
                return successNoData(res, CREATED, 'campaign successfully updated');
            }
        } catch (error) {
            tryCatchError(res, error);
        }
    },
};

module.exports = Campaign;
