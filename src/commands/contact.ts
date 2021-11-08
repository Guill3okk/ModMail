import Command from '../lib/structures/Command';
import MessageEmbed from '../lib/structures/MessageEmbed';

export default new Command('contact', async (caller, cmd, _log, config) => {
	if (!cmd.args[0])
		return caller.utils.discord.createMessage(cmd.channel.id, 'Por favor, especifique a alguien con quien contactar.');

	const user = cmd.msg.mentions[0] || caller.bot.users.get(cmd.args[0]) || await caller.utils.discord.fetchUser(cmd.args[0]);
	if (!user || !cmd.channel.guild.members.has(user.id))
		return caller.utils.discord.createMessage(cmd.channel.id, 'Miembro no encontrado.');
	if (user.bot)
		return caller.utils.discord.createMessage(cmd.channel.id, 'No puedes contactar a un bot.');

	// Check if there is a current thread of the specified user.
	const openLog = await caller.db.getLog(user.id, 'USER');
	if (!openLog) {
		// Creates the channel on the main server.
		const serverChannel = await caller.utils.discord.createChannel(process.env.MAIN_GUILD_ID!, `${user.username}-${user.discriminator}`, 'GUILD_TEXT', {
			parentID: config.mainCategoryID,
			topic: user.id
		});
		if (!serverChannel)
			return caller.utils.discord.createMessage(cmd.channel.id, 'Lo sentimos, se ha producido un error al abrir el canal del servidor.');

		// User Embed
		const userEmbed = new MessageEmbed()
			.setTitle(config.embeds.contact.title)
			.setColor(config.embeds.contact.color)
			.setDescription(config.embeds.contact.description)
			.setFooter(config.embeds.contact.footer, config.embeds.contact.footerImageURL)
			.setTimestamp();
		if (config.embeds.contact.thumbnail)
			userEmbed.setThumbnail(config.embeds.contact.thumbnail);
		const userMsg = await caller.utils.discord.createMessage(user.id, { embed: userEmbed.code }, true);
		if (!userMsg) {
			caller.utils.discord.createMessage(cmd.channel.id, 'Lo sentimos, no pude DM con el usuario seleccionado.');
			return serverChannel.delete('No se pudo DM con el usuario.');
		}

		await caller.db.createLog({
			open: true,
			channelID: serverChannel.id,
			recipient: {
				id: user.id,
				username: user.username,
				discriminator: user.discriminator,
				avatarURL: user.dynamicAvatarURL()
			},
			creator: {
				id: cmd.msg.author.id,
				username: cmd.msg.author.username,
				discriminator: cmd.msg.author.discriminator,
				avatarURL: cmd.msg.author.dynamicAvatarURL()
			}
		});

		// Send the message to the new channel.
		caller.utils.discord.createMessage(serverChannel.id, `<@${cmd.msg.author.id}> the user <@${user.id}> ha sido contactado. Utilice este hilo como uno normal.`);
		return caller.utils.discord.createMessage(cmd.channel.id, 'El usuario ha sido contactado.');
	}
	else return caller.utils.discord.createMessage(cmd.channel.id, 'Ya hay un hilo abierto con este usuario.');
},
{
	level: 'SUPPORT',
	aliases: ['open']
});
