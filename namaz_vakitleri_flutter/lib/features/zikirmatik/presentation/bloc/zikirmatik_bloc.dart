import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/zikirmatik_repository.dart';

part 'zikirmatik_event.dart';
part 'zikirmatik_state.dart';

class ZikirmatikBloc extends Bloc<ZikirmatikEvent, ZikirmatikState> {
  ZikirmatikBloc(this._repo) : super(const ZikirmatikStateInitial()) {
    on<ZikirmatikLoadRequested>(_onLoad);
    on<ZikirmatikCountUpdated>(_onCountUpdated);
  }

  final ZikirmatikRepository _repo;

  void _onLoad(ZikirmatikLoadRequested event, Emitter<ZikirmatikState> emit) {
    emit(ZikirmatikStateLoaded(history: _repo.getHistory()));
  }

  Future<void> _onCountUpdated(ZikirmatikCountUpdated event, Emitter<ZikirmatikState> emit) async {
    await _repo.setCountForDate(event.dateKey, event.count);
    emit(ZikirmatikStateLoaded(history: _repo.getHistory()));
  }
}
