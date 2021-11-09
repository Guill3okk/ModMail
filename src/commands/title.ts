import Command from '../lib/structures/Command';

export default new Command('title', async (caller, cmd, log) => {
	if (!cmd.args[0])
		return caller.utils.discord.createMessage(cmd.channel.id, 'Proporcione un título o escriba `removetitle` para quitar el título.');
	const updated = await caller.db.updateLog(log!._id, 'title', cmd.args[0] === 'removetitle' ? '' : cmd.args.join(' '), cmd.args[0] === 'removetitle' ? 'UNSET' : 'SET');
	if (updated)
		return caller.utils.discord.createMessage(cmd.channel.id, 'El título se ha actualizado.');
	if (!updated)
		return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el título.');
},
{
	level: 'SUPPORT',
	threadOnly: true,
	aliases: []
});
