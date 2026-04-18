import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../common/constants/roles';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CreateMuscleGroupDto } from './dto/create-muscle-group.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { UpdateMuscleGroupDto } from './dto/update-muscle-group.dto';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('muscle-groups')
  getMuscleGroups() {
    return this.exercisesService.getMuscleGroups();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAllAdmin() {
    return this.exercisesService.findAllAdmin();
  }

  @Get()
  findAll(
    @Query('muscleGroup') muscleGroup?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    return this.exercisesService.findAll({
      muscleGroupSlug: muscleGroup,
      level,
      search,
      featured: featured === 'true',
    });
  }

  @Post('muscle-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createGroup(@Body() dto: CreateMuscleGroupDto) {
    return this.exercisesService.createMuscleGroup(dto);
  }

  @Patch('muscle-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMuscleGroupDto,
  ) {
    return this.exercisesService.updateMuscleGroup(id, dto);
  }

  @Delete('muscle-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.exercisesService.removeMuscleGroup(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateExerciseDto) {
    return this.exercisesService.create(dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggle(@Param('id', ParseUUIDPipe) id: string) {
    return this.exercisesService.toggleActive(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.exercisesService.remove(id);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.exercisesService.findBySlug(slug);
  }
}
